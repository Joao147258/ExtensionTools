import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import {
  runGuard,
  getStagedFiles,
  getOutgoingFiles,
  getOutgoingCommitObjects,
  prepareStagedSnapshot,
  prepareOutgoingSnapshots,
} from '../../../scripts/security/publication-guard.mjs';

describe('Git Integration & Hook Behavior', () => {
  let gitDir;

  beforeEach(() => {
    gitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-sec-test-'));
    execSync('git init', { cwd: gitDir, stdio: 'ignore' });
    execSync('git config user.name "Test Developer"', { cwd: gitDir });
    execSync('git config user.email "test@example.com"', { cwd: gitDir });

    // Setup project safety config
    fs.mkdirSync(path.join(gitDir, '.harness/config'), { recursive: true });
    const config = {
      version: '1.0.0',
      rules: {
        publicDirectories: ['docs', 'src'],
        prohibitedDirectories: ['.local', 'docs/Relatorios', 'docs/reports', 'private'],
        privateMarkdownSuffixes: ['.private.md'],
        confidentialityMarkers: ['CONFIDENTIAL'],
        prohibitedFilePatterns: ['\\.env($|\\..+)', '\\.key$'],
        allowedFileExceptions: ['^\\.env\\.example$'],
        secretsPatterns: [
          {
            name: 'AWS Key',
            regex: '\\bAKIA[0-9A-Z]{16}\\b',
          },
        ],
        privatePathPatterns: ['/home/[a-zA-Z0-9._-]+/'],
        privatePathExceptions: [],
      },
    };
    fs.writeFileSync(
      path.join(gitDir, '.harness/config/repository-safety.config.json'),
      JSON.stringify(config, null, 2)
    );
  });

  afterEach(() => {
    fs.rmSync(gitDir, { recursive: true, force: true });
  });

  it('detects sensitive files added with git add -f (force add bypass test)', () => {
    const secretFile = path.join(gitDir, '.env');
    fs.writeFileSync(secretFile, 'DATABASE_PASSWORD=supersecret');

    // Force add to git index
    execSync('git add -f .env', { cwd: gitDir });

    const staged = execSync('git diff --cached --name-only', {
      cwd: gitDir,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');

    expect(staged).toContain('.env');

    // Run guard on staged files
    const result = runGuard(staged, { projectRoot: gitDir });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.file === '.env')).toBe(true);
  });

  it('detects and blocks confidential markdown in git index', () => {
    const doc = path.join(gitDir, 'docs/secret.private.md');
    fs.mkdirSync(path.dirname(doc), { recursive: true });
    fs.writeFileSync(doc, '# Confidential Meeting Notes');

    execSync('git add -f docs/secret.private.md', { cwd: gitDir });

    const staged = execSync('git diff --cached --name-only', {
      cwd: gitDir,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');

    const result = runGuard(staged, { projectRoot: gitDir });
    expect(result.passed).toBe(false);
    expect(result.violations[0].rule).toBe('PRIVATE_MARKDOWN_SUFFIX');
  });

  it('passes completely for valid public files', () => {
    const doc = path.join(gitDir, 'docs/architecture.md');
    fs.mkdirSync(path.dirname(doc), { recursive: true });
    fs.writeFileSync(doc, '# Extension Architecture\nClean modular design.');

    execSync('git add docs/architecture.md', { cwd: gitDir });

    const staged = execSync('git diff --cached --name-only', {
      cwd: gitDir,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');

    const result = runGuard(staged, { projectRoot: gitDir });
    expect(result.passed).toBe(true);
  });

  describe('Fase 0 — Baseline Git & Edge Case Tests', () => {
    it('returns empty list safely for getStagedFiles when nothing is staged in empty repo', () => {
      const staged = getStagedFiles(gitDir);
      expect(staged).toEqual([]);
    });

    it('returns empty list safely for getOutgoingFiles when no commits exist', () => {
      const outgoing = getOutgoingFiles(gitDir);
      expect(outgoing).toEqual([]);
    });

    it('handles files with spaces and unicode correctly in staged mode', () => {
      const fileName = 'docs/plano especial de segurança 🚀.md';
      fs.mkdirSync(path.dirname(path.join(gitDir, fileName)), { recursive: true });
      fs.writeFileSync(path.join(gitDir, fileName), '# Documento Válido');

      execSync(`git add "${fileName}"`, { cwd: gitDir });

      const staged = getStagedFiles(gitDir);
      expect(staged).toContain(fileName);

      const result = runGuard(staged, { projectRoot: gitDir });
      expect(result.passed).toBe(true);
    });

    it('adversarial: detects secret staged in index even if file was subsequently modified/cleaned in working tree', () => {
      const fileName = 'src/api-config.ts';
      fs.mkdirSync(path.dirname(path.join(gitDir, fileName)), { recursive: true });

      // 1. Escreve com segredo no disco e adiciona ao stage
      fs.writeFileSync(
        path.join(gitDir, fileName),
        'export const AWS_KEY = "' + 'AKIA' + '1234567890ABCDEF";'
      );
      execSync(`git add "${fileName}"`, { cwd: gitDir });

      // 2. Modifica no working tree para texto limpo (tentativa de burlar scanner)
      fs.writeFileSync(path.join(gitDir, fileName), 'export const AWS_KEY = "MOCK_KEY_SAFE";');

      const staged = getStagedFiles(gitDir);
      expect(staged).toContain(fileName);

      const snapshot = prepareStagedSnapshot(staged, gitDir);
      try {
        const result = runGuard(staged, { projectRoot: snapshot.targetRoot });
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.rule === 'SECRET_PATTERN_MATCH')).toBe(true);
      } finally {
        snapshot.cleanup();
      }
    });

    it('blocks files placed inside docs/Relatorios from publication guard', () => {
      const relPath = 'docs/Relatorios/meu-relatorio.md';
      const fullPath = path.join(gitDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, '# Relatório Interno');

      execSync(`git add -f "${relPath}"`, { cwd: gitDir });
      const staged = getStagedFiles(gitDir);

      const result = runGuard(staged, { projectRoot: gitDir });
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.rule === 'SENSITIVE_DIRECTORY')).toBe(true);
    });

    it('detects type change (file replaced by symlink) with --diff-filter=ACMRT', () => {
      const targetFile = 'docs/link-test.md';
      const fullPath = path.join(gitDir, targetFile);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, '# Conteúdo Normal');
      execSync(`git add "${targetFile}"`, { cwd: gitDir });
      execSync('git commit -m "initial commit"', { cwd: gitDir });

      // Converte o arquivo regular em symlink (type change T)
      fs.unlinkSync(fullPath);
      fs.symlinkSync('/dev/null', fullPath);
      execSync(`git add "${targetFile}"`, { cwd: gitDir });

      const staged = getStagedFiles(gitDir);
      expect(staged).toContain(targetFile);
    });

    it('adversarial outgoing: detects secret committed in outgoing commit even if working tree is clean', () => {
      const fileName = 'src/credentials.ts';
      const fullPath = path.join(gitDir, fileName);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      // Commit 1: adiciona segredo e commita
      fs.writeFileSync(fullPath, 'export const AWS_ACCESS_KEY = "' + 'AKIA' + '1234567890ABCDEF";');
      execSync(`git add "${fileName}"`, { cwd: gitDir });
      execSync('git commit -m "add credentials"', { cwd: gitDir });

      // Limpa no working tree sem novo commit
      fs.writeFileSync(fullPath, 'export const AWS_ACCESS_KEY = "CLEANED_IN_WORKING_TREE";');

      const commitObjs = getOutgoingCommitObjects(gitDir);
      expect(commitObjs.some((o) => o.file === fileName)).toBe(true);

      const snapshots = prepareOutgoingSnapshots(commitObjs, gitDir);
      try {
        let detectedSecret = false;
        for (const snap of snapshots) {
          const res = runGuard(snap.files, { projectRoot: snap.targetRoot });
          if (res.violations.some((v) => v.rule === 'SECRET_PATTERN_MATCH')) {
            detectedSecret = true;
          }
        }
        expect(detectedSecret).toBe(true);
      } finally {
        snapshots.forEach((s) => s.cleanup());
      }
    });

    it('adversarial outgoing: detects secret committed in earlier commit even if removed in subsequent commit', () => {
      const fileName = 'src/temp-auth.ts';
      const fullPath = path.join(gitDir, fileName);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      // Commit 1: introduz segredo
      fs.writeFileSync(fullPath, 'const key = "' + 'AKIA' + '9999999999ABCDEF";');
      execSync(`git add "${fileName}"`, { cwd: gitDir });
      execSync('git commit -m "feat: temporary auth"', { cwd: gitDir });

      // Commit 2: remove o segredo
      fs.writeFileSync(fullPath, 'const key = "REMOVED_SECRET";');
      execSync(`git commit -am "fix: remove secret"`, { cwd: gitDir });

      const commitObjs = getOutgoingCommitObjects(gitDir);
      // Deve ter inspecionado ambos os commits
      expect(commitObjs.length).toBeGreaterThanOrEqual(2);

      const snapshots = prepareOutgoingSnapshots(commitObjs, gitDir);
      try {
        let detected = false;
        for (const snap of snapshots) {
          const res = runGuard(snap.files, { projectRoot: snap.targetRoot });
          if (res.violations.some((v) => v.rule === 'SECRET_PATTERN_MATCH')) {
            detected = true;
          }
        }
        expect(detected).toBe(true);
      } finally {
        snapshots.forEach((s) => s.cleanup());
      }
    });

    it('validates hook publication-guard CLI exits with code 1 on outgoing violation', () => {
      const fileName = 'src/leaked-token.ts';
      const fullPath = path.join(gitDir, fileName);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      fs.writeFileSync(fullPath, 'export const AWS_ACCESS_KEY = "' + 'AKIA' + '1234567890ABCDEF";');
      execSync(`git add "${fileName}"`, { cwd: gitDir });
      execSync('git commit -m "leak token"', { cwd: gitDir });

      // Executa publication-guard CLI no modo outgoing no gitDir
      const scriptPath = path.join(process.cwd(), 'scripts/security/publication-guard.mjs');
      let exitCode = 0;
      try {
        execSync(`node "${scriptPath}" outgoing`, {
          cwd: gitDir,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err) {
        exitCode = err.status;
      }

      expect(exitCode).toBe(1);
    });
  });
});
