import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanMarkdownFiles } from '../../../scripts/security/scan-markdown.mjs';
import { scanSensitiveFiles } from '../../../scripts/security/scan-sensitive-files.mjs';
import { scanSecrets } from '../../../scripts/security/scan-secrets.mjs';
import { scanPrivatePaths } from '../../../scripts/security/scan-private-paths.mjs';
import { scanForbiddenReferences } from '../../../scripts/security/scan-forbidden-references.mjs';
import { runGuard } from '../../../scripts/security/publication-guard.mjs';

describe('Security Scanners Unit Tests', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sec-test-'));
    // Setup minimal config in tmpDir
    fs.mkdirSync(path.join(tmpDir, '.harness/config'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, '.local'), { recursive: true });

    const minimalConfig = {
      version: '1.0.0',
      rules: {
        publicDirectories: ['docs', 'src', 'tests'],
        prohibitedDirectories: ['.local', 'private', 'confidential'],
        privateMarkdownSuffixes: ['.private.md', '.local.md'],
        confidentialityMarkers: ['CONFIDENTIAL', 'INTERNAL USE ONLY'],
        prohibitedFilePatterns: ['\\.env($|\\..+)', '\\.(pem|key)$', '\\.(bak|sql)$'],
        allowedFileExceptions: ['^\\.env\\.example$'],
        secretsPatterns: [
          {
            name: 'AWS Key',
            regex: '\\bAKIA[0-9A-Z]{16}\\b',
          },
          {
            name: 'Generic Key Assignment',
            regex: 'api_key\\s*=\\s*[\'"][A-Za-z0-9_-]{16,}[\'"]',
          },
        ],
        privatePathPatterns: ['/home/[a-zA-Z0-9._-]+/'],
        privatePathExceptions: ['/home/runner/work/'],
      },
    };

    fs.writeFileSync(
      path.join(tmpDir, '.harness/config/repository-safety.config.json'),
      JSON.stringify(minimalConfig, null, 2)
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('scanMarkdownFiles', () => {
    it('passes public markdown without confidential markers', () => {
      const docPath = path.join(tmpDir, 'docs/public-guide.md');
      fs.mkdirSync(path.dirname(docPath), { recursive: true });
      fs.writeFileSync(docPath, '# Public Guide\nThis is open source documentation.');

      const result = scanMarkdownFiles([docPath], { projectRoot: tmpDir });
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('blocks markdown with private suffix (.private.md)', () => {
      const docPath = path.join(tmpDir, 'docs/internal.private.md');
      fs.mkdirSync(path.dirname(docPath), { recursive: true });
      fs.writeFileSync(docPath, '# Private note');

      const result = scanMarkdownFiles([docPath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('PRIVATE_MARKDOWN_SUFFIX');
    });

    it('blocks markdown located in prohibited directory (private/)', () => {
      const docPath = path.join(tmpDir, 'private/secret.md');
      fs.mkdirSync(path.dirname(docPath), { recursive: true });
      fs.writeFileSync(docPath, '# Secret note');

      const result = scanMarkdownFiles([docPath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.rule === 'PROHIBITED_DIRECTORY')).toBe(true);
    });

    it('blocks markdown containing confidentiality marker', () => {
      const docPath = path.join(tmpDir, 'docs/report.md');
      fs.mkdirSync(path.dirname(docPath), { recursive: true });
      fs.writeFileSync(docPath, '# Architectural Report\nCONFIDENTIAL - Do not share.');

      const result = scanMarkdownFiles([docPath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('CONFIDENTIALITY_MARKER');
    });
  });

  describe('scanSensitiveFiles', () => {
    it('blocks .env and .key files', () => {
      const files = ['.env', 'server.key', 'backup.sql'];
      const result = scanSensitiveFiles(files, { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(3);
    });

    it('allows .env.example exception', () => {
      const files = ['.env.example'];
      const result = scanSensitiveFiles(files, { projectRoot: tmpDir });
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('scanSecrets', () => {
    it('detects and flags simulated secrets without leaking secret in details', () => {
      const filePath = path.join(tmpDir, 'src/api.ts');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const testToken = 'AKIA' + 'IOSFODNN7EXAMPLE';
      fs.writeFileSync(filePath, `const token = "${testToken}";`);

      const result = scanSecrets([filePath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('SECRET_PATTERN_MATCH');
      expect(result.violations[0].details).not.toContain(testToken);
    });
  });

  describe('scanPrivatePaths', () => {
    it('blocks workstation absolute paths', () => {
      const filePath = path.join(tmpDir, 'src/config.ts');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const testPath = ['', 'home', 'developer_xyz', 'project'].join('/');
      fs.writeFileSync(filePath, `const p = "${testPath}";`);

      const result = scanPrivatePaths([filePath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('PRIVATE_ABSOLUTE_PATH');
    });

    it('permits CI runner path exceptions (/home/runner/work/)', () => {
      const filePath = path.join(tmpDir, 'src/ci.ts');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, 'const ciPath = "/home/runner/work/repo/repo";');

      const result = scanPrivatePaths([filePath], { projectRoot: tmpDir });
      expect(result.passed).toBe(true);
    });
  });

  describe('scanForbiddenReferences', () => {
    it('blocks forbidden tokens from .local/repository-safety.private.json without exposing token', () => {
      const privateConfig = {
        forbiddenReferences: ['CORP_CONFIDENTIAL_NAME'],
      };
      fs.writeFileSync(
        path.join(tmpDir, '.local/repository-safety.private.json'),
        JSON.stringify(privateConfig)
      );

      const filePath = path.join(tmpDir, 'docs/notes.md');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, 'This mentions CORP_CONFIDENTIAL_NAME in context.');

      const result = scanForbiddenReferences([filePath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations[0].rule).toBe('FORBIDDEN_REFERENCE_DETECTED');
      expect(result.violations[0].details).not.toContain('CORP_CONFIDENTIAL_NAME');
    });
  });

  describe('runGuard integration', () => {
    it('aggregates violations across all categories', () => {
      const docPath = path.join(tmpDir, 'docs/bad.private.md');
      fs.mkdirSync(path.dirname(docPath), { recursive: true });
      fs.writeFileSync(docPath, 'api_' + 'key = "abcdef1234567890abcdef"');

      const result = runGuard([docPath], { projectRoot: tmpDir });
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });
});
