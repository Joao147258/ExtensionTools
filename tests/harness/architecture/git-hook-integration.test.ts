import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

describe('ARC-HOOK — Git Hook Integration Tests (QG-02 & QG-01)', () => {
  let tmpRepoDir: string;
  const projectRoot = process.cwd();
  const preCommitHookPath = path.join(projectRoot, '.githooks/pre-commit');
  const prePushHookPath = path.join(projectRoot, '.githooks/pre-push');

  beforeEach(() => {
    tmpRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-hook-arch-test-'));
    execSync('git init', { cwd: tmpRepoDir, stdio: 'ignore' });
    execSync('git config user.name "Test Engineer"', { cwd: tmpRepoDir });
    execSync('git config user.email "engineer@example.com"', { cwd: tmpRepoDir });

    // Copia estrutura mínima necessária para os hooks executarem no repositório temporário
    fs.mkdirSync(path.join(tmpRepoDir, '.harness/config'), { recursive: true });
    fs.mkdirSync(path.join(tmpRepoDir, 'scripts/security'), { recursive: true });
    fs.mkdirSync(path.join(tmpRepoDir, 'scripts/architecture'), { recursive: true });
    fs.mkdirSync(path.join(tmpRepoDir, 'scripts/lib'), { recursive: true });

    // Configuração de segurança
    const safetyConfig = {
      version: '1.0.0',
      rules: {
        publicDirectories: ['docs', 'src'],
        prohibitedDirectories: ['.local', 'private'],
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
      path.join(tmpRepoDir, '.harness/config/repository-safety.config.json'),
      JSON.stringify(safetyConfig, null, 2)
    );

    // Copia os scripts reais para execução fiel no repo de teste
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/publication-guard.mjs'),
      path.join(tmpRepoDir, 'scripts/security/publication-guard.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/config-loader.mjs'),
      path.join(tmpRepoDir, 'scripts/security/config-loader.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/scan-secrets.mjs'),
      path.join(tmpRepoDir, 'scripts/security/scan-secrets.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/scan-sensitive-files.mjs'),
      path.join(tmpRepoDir, 'scripts/security/scan-sensitive-files.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/scan-markdown.mjs'),
      path.join(tmpRepoDir, 'scripts/security/scan-markdown.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/scan-forbidden-references.mjs'),
      path.join(tmpRepoDir, 'scripts/security/scan-forbidden-references.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/security/scan-private-paths.mjs'),
      path.join(tmpRepoDir, 'scripts/security/scan-private-paths.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/architecture/boundary-linter.mjs'),
      path.join(tmpRepoDir, 'scripts/architecture/boundary-linter.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/architecture/verify-module-boundaries.mjs'),
      path.join(tmpRepoDir, 'scripts/architecture/verify-module-boundaries.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/lib/ast-analyzer.mjs'),
      path.join(tmpRepoDir, 'scripts/lib/ast-analyzer.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/lib/dependency-graph.mjs'),
      path.join(tmpRepoDir, 'scripts/lib/dependency-graph.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/lib/fs-utils.mjs'),
      path.join(tmpRepoDir, 'scripts/lib/fs-utils.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/lib/git-utils.mjs'),
      path.join(tmpRepoDir, 'scripts/lib/git-utils.mjs')
    );
    fs.copyFileSync(
      path.join(projectRoot, 'scripts/lib/logger.mjs'),
      path.join(tmpRepoDir, 'scripts/lib/logger.mjs')
    );

    // tsconfig base para resolução
    const tsConfig = {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
        },
      },
    };
    fs.writeFileSync(path.join(tmpRepoDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  });

  afterEach(() => {
    fs.rmSync(tmpRepoDir, { recursive: true, force: true });
  });

  it('1. Aprova hook pre-commit para alteração arquitetural perfeitamente válida', () => {
    // Cria estrutura válida: feature com core e ui chamando index público
    const coreFile = path.join(tmpRepoDir, 'src/features/text-diff/core/engine.ts');
    const indexFile = path.join(tmpRepoDir, 'src/features/text-diff/index.ts');
    fs.mkdirSync(path.dirname(coreFile), { recursive: true });
    fs.writeFileSync(coreFile, 'export function computeDiff() { return []; }');
    fs.writeFileSync(indexFile, "export * from './core/engine';");

    execSync('git add src/', { cwd: tmpRepoDir });

    let exitCode = 0;
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: any) {
      exitCode = err.status;
    }

    expect(exitCode).toBe(0);
  });

  it('2. Bloqueia hook pre-commit com código 1 diante de violação ARC-R01 (cross-feature)', () => {
    const featA = path.join(tmpRepoDir, 'src/features/feat-a/core/engine.ts');
    const featB = path.join(tmpRepoDir, 'src/features/feat-b/core/service.ts');
    fs.mkdirSync(path.dirname(featA), { recursive: true });
    fs.mkdirSync(path.dirname(featB), { recursive: true });

    fs.writeFileSync(featB, 'export const helper = 42;');
    // Violação ARC-R01: feat-a importando de feat-b
    fs.writeFileSync(featA, "import { helper } from '../../feat-b/core/service';");

    execSync('git add src/', { cwd: tmpRepoDir });

    let exitCode = 0;
    let output = '';
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
      output = (err.stdout || '') + (err.stderr || '');
    }

    expect(exitCode).toBe(1);
    expect(output).toContain('ARC-R01');
    expect(output).toContain('feat-a');
    expect(output).toContain('feat-b');
  });

  it('3. Bloqueia hook pre-commit com código 1 diante de dependência circular (ARC-R07)', () => {
    const fileA = path.join(tmpRepoDir, 'src/features/loop/core/a.ts');
    const fileB = path.join(tmpRepoDir, 'src/features/loop/core/b.ts');
    fs.mkdirSync(path.dirname(fileA), { recursive: true });

    fs.writeFileSync(fileA, "import './b';\nexport const a = 1;");
    fs.writeFileSync(fileB, "import './a';\nexport const b = 2;");

    execSync('git add src/', { cwd: tmpRepoDir });

    let exitCode = 0;
    let output = '';
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
      output = (err.stdout || '') + (err.stderr || '');
    }

    expect(exitCode).toBe(1);
    expect(output).toContain('ARC-R07');
    expect(output.toLowerCase()).toContain('ciclo');
  });

  it('4. Bloqueia hook pre-commit com código 1 quando alias aponta para caminho inexistente (ARC-R08)', () => {
    const file = path.join(tmpRepoDir, 'src/entrypoints/sidepanel/index.ts');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "import { Ghost } from '@/features/non-existent-module';");

    execSync('git add src/', { cwd: tmpRepoDir });

    let exitCode = 0;
    let output = '';
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
      output = (err.stdout || '') + (err.stderr || '');
    }

    expect(exitCode).toBe(1);
    expect(output).toContain('ARC-R08');
  });

  it('5. Executa pre-commit normalmente sem invocar boundary linter quando não há arquivos de código staged', () => {
    const docFile = path.join(tmpRepoDir, 'docs/notes.md');
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, '# Public Documentation Note');

    execSync('git add docs/', { cwd: tmpRepoDir });

    let output = '';
    let exitCode = 0;
    try {
      output = execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
    }

    expect(exitCode).toBe(0);
    expect(output).toContain('Pre-Commit Security Guard');
    expect(output).not.toContain('Architecture Boundary Linter');
  });

  it('6. Aborta hook pre-commit com erro 2 ou 1 diante de tsconfig corrompido', () => {
    const file = path.join(tmpRepoDir, 'src/features/sample/core/index.ts');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'export const val = 10;');

    // Corrompe tsconfig.json
    fs.writeFileSync(path.join(tmpRepoDir, 'tsconfig.json'), '{ "invalidJson": [ ');

    execSync('git add src/ tsconfig.json', { cwd: tmpRepoDir });

    let exitCode = 0;
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: any) {
      exitCode = err.status;
    }

    // Deve falhar com exitCode != 0 (2 para erro operacional ou 1 pelo linter)
    expect(exitCode).toBeGreaterThanOrEqual(1);
  });

  it('7. Preserva checagem de segurança e bloqueia commit antes do linter diante de segredo', () => {
    // Adiciona segredo no staged
    const secretFile = path.join(tmpRepoDir, '.env');
    fs.writeFileSync(secretFile, 'AWS_SECRET_KEY=' + 'AKIA' + '1234567890ABCDEF');
    execSync('git add -f .env', { cwd: tmpRepoDir });

    let exitCode = 0;
    let output = '';
    try {
      execSync(`bash "${preCommitHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
      output = (err.stdout || '') + (err.stderr || '');
    }

    expect(exitCode).toBe(1);
    expect(output).toContain('Pre-Commit Security Guard');
    // Deve ser bloqueado antes de avaliar o código
    expect(output).not.toContain('Code changes detected in index');
  });

  it('8. Bloqueia hook pre-push diante de violação arquitetural outgoing', () => {
    // Cria commit inicial válido
    const readme = path.join(tmpRepoDir, 'README.md');
    fs.writeFileSync(readme, '# Project Readme');
    execSync('git add README.md', { cwd: tmpRepoDir });
    execSync('git commit -m "initial commit"', { cwd: tmpRepoDir });

    // Cria commit com violação arquitetural ARC-R01
    const featA = path.join(tmpRepoDir, 'src/features/feat-x/core.ts');
    const featB = path.join(tmpRepoDir, 'src/features/feat-y/core.ts');
    fs.mkdirSync(path.dirname(featA), { recursive: true });
    fs.mkdirSync(path.dirname(featB), { recursive: true });
    fs.writeFileSync(featB, 'export const y = 1;');
    fs.writeFileSync(featA, "import { y } from '../feat-y/core';");
    execSync('git add src/', { cwd: tmpRepoDir });
    execSync('git commit -m "introduce architectural leak"', { cwd: tmpRepoDir });

    let exitCode = 0;
    let output = '';
    try {
      execSync(`bash "${prePushHookPath}"`, {
        cwd: tmpRepoDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
    } catch (err: any) {
      exitCode = err.status;
      output = (err.stdout || '') + (err.stderr || '');
    }

    expect(exitCode).toBe(1);
    expect(output).toContain('Pre-Push');
    expect(output).toContain('ARC-R01');
  });
});
