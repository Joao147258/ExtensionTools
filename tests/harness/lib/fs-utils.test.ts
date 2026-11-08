import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  normalizePath,
  resolveSafePath,
  walkDirectory,
  readTextFileSafe,
} from '../../../scripts/lib/fs-utils.mjs';

describe('LIB-01 — fs-utils.mjs Unit Tests', () => {
  let tmpRoot;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  describe('normalizePath()', () => {
    it('converts Windows backslashes to universal forward slashes', () => {
      expect(normalizePath('src\\features\\calendar\\ui')).toBe('src/features/calendar/ui');
      expect(normalizePath('C:\\' + 'Users\\dev\\project')).toBe('C:/' + 'Users/dev/project');
    });

    it('preserves paths that already have forward slashes', () => {
      expect(normalizePath('src/shared/types/index.ts')).toBe('src/shared/types/index.ts');
    });

    it('throws TypeError if argument is not a string', () => {
      expect(() => normalizePath(null)).toThrow(TypeError);
      expect(() => normalizePath(123)).toThrow(TypeError);
    });
  });

  describe('resolveSafePath() — Path Traversal Prevention', () => {
    it('resolves safe relative paths inside project root', () => {
      const resolved = resolveSafePath('docs/architecture.md', tmpRoot);
      expect(resolved).toBe(path.resolve(tmpRoot, 'docs/architecture.md'));
    });

    it('throws Error when path attempts path traversal outside root', () => {
      expect(() => resolveSafePath('../../etc/passwd', tmpRoot)).toThrow(
        /Violação de segurança \(Path Traversal detectado\)/
      );
    });
  });

  describe('walkDirectory()', () => {
    it('returns empty array when walking an empty directory', () => {
      const files = walkDirectory(tmpRoot, {}, tmpRoot);
      expect(files).toEqual([]);
    });

    it('recursively discovers files and respects ignored directories', () => {
      fs.mkdirSync(path.join(tmpRoot, 'src/features'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'node_modules/pkg'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, '.git/objects'), { recursive: true });

      fs.writeFileSync(path.join(tmpRoot, 'src/features/diff.ts'), 'export const a = 1;');
      fs.writeFileSync(path.join(tmpRoot, 'node_modules/pkg/index.js'), 'ignored');
      fs.writeFileSync(path.join(tmpRoot, '.git/objects/commit'), 'ignored');

      const files = walkDirectory(tmpRoot, {}, tmpRoot);
      expect(files).toContain('src/features/diff.ts');
      expect(files).not.toContain('node_modules/pkg/index.js');
      expect(files).not.toContain('.git/objects/commit');
    });

    it('applies includePatterns and excludePatterns correctly', () => {
      fs.writeFileSync(path.join(tmpRoot, 'doc.md'), '# Doc');
      fs.writeFileSync(path.join(tmpRoot, 'app.ts'), 'const x = 1;');
      fs.writeFileSync(path.join(tmpRoot, 'temp.bak'), 'backup');

      const mdFiles = walkDirectory(
        tmpRoot,
        {
          includePatterns: [/\.md$/],
          excludePatterns: [/\.bak$/],
        },
        tmpRoot
      );

      expect(mdFiles).toContain('doc.md');
      expect(mdFiles).not.toContain('app.ts');
      expect(mdFiles).not.toContain('temp.bak');
    });

    it('handles files with unicode and spaces without error', () => {
      const fileName = 'relatório com espaços e acentuação 🚀.txt';
      fs.writeFileSync(path.join(tmpRoot, fileName), 'conteudo');

      const files = walkDirectory(tmpRoot, {}, tmpRoot);
      expect(files).toContain(fileName);
    });
  });

  describe('readTextFileSafe()', () => {
    it('reads valid text file within size limits', () => {
      const filePath = path.join(tmpRoot, 'test.txt');
      fs.writeFileSync(filePath, 'Hello ExtensionTools', 'utf8');

      const content = readTextFileSafe('test.txt', tmpRoot);
      expect(content).toBe('Hello ExtensionTools');
    });

    it('throws Error if file does not exist', () => {
      expect(() => readTextFileSafe('inexistente.txt', tmpRoot)).toThrow(
        /readTextFileSafe: Arquivo inexistente/
      );
    });

    it('throws Error if file exceeds maximum size limit', () => {
      const filePath = path.join(tmpRoot, 'big.txt');
      fs.writeFileSync(filePath, 'A'.repeat(200));

      expect(() => readTextFileSafe('big.txt', tmpRoot, 100)).toThrow(/excede o limite tolerado/);
    });
  });
});
