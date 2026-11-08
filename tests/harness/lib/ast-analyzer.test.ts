import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  extractDependenciesFromSource,
  resolveLocalModulePath,
  resolveModule,
  loadTsConfig,
  clearTsConfigCache,
  analyzeSourceFile,
} from '../../../scripts/lib/ast-analyzer.mjs';

describe('LIB-04 — ast-analyzer.mjs Unit Tests', () => {
  let tmpRoot;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-analyzer-test-'));
    clearTsConfigCache();
  });

  afterEach(() => {
    clearTsConfigCache();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('extracts static imports, named imports, and distinguishes type-only imports', () => {
    const code = `
      import React, { useState } from 'react';
      import type { UserProfile } from './types';
      import { calculateDiff } from '../core/diff';
      // import commentIgnored from './fake';
      /* import multiLineIgnored from './fake2'; */
      const fakeString = "import notCode from './fake3'";
    `;

    const filePath = path.join(tmpRoot, 'component.tsx');
    fs.writeFileSync(filePath, code);

    const deps = extractDependenciesFromSource(filePath, tmpRoot);

    expect(deps.length).toBe(3);

    // 1. React
    expect(deps[0].moduleSpecifier).toBe('react');
    expect(deps[0].isTypeOnly).toBe(false);
    expect(deps[0].importedSymbols).toContain('React');
    expect(deps[0].importedSymbols).toContain('useState');

    // 2. Types (type-only)
    expect(deps[1].moduleSpecifier).toBe('./types');
    expect(deps[1].isTypeOnly).toBe(true);
    expect(deps[1].importedSymbols).toContain('UserProfile');

    // 3. Diff (runtime)
    expect(deps[2].moduleSpecifier).toBe('../core/diff');
    expect(deps[2].isTypeOnly).toBe(false);
  });

  it('extracts reexports and dynamic imports correctly', () => {
    const code = `
      export { Button, Panel } from './ui-components';
      export type { Theme } from './theme';

      export async function loadFeature() {
        const mod = await import('./dynamic-feature');
        return mod;
      }
    `;

    const filePath = path.join(tmpRoot, 'index.ts');
    fs.writeFileSync(filePath, code);

    const deps = extractDependenciesFromSource(filePath, tmpRoot);

    expect(deps.some((d) => d.isExport && d.moduleSpecifier === './ui-components')).toBe(true);
    expect(deps.some((d) => d.isExport && d.isTypeOnly && d.moduleSpecifier === './theme')).toBe(
      true
    );
    expect(deps.some((d) => d.isDynamic && d.moduleSpecifier === './dynamic-feature')).toBe(true);
  });

  it('resolves local relative module paths in disk correctly', () => {
    const srcDir = path.join(tmpRoot, 'src/features/diff');
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, 'engine.ts'), 'export const run = () => {};');
    fs.writeFileSync(path.join(srcDir, 'index.ts'), "export * from './engine';");

    const resolved = resolveLocalModulePath('./engine', path.join(srcDir, 'index.ts'), tmpRoot);
    expect(resolved).toBe('src/features/diff/engine.ts');

    const external = resolveLocalModulePath('react', path.join(srcDir, 'index.ts'), tmpRoot);
    expect(external).toBeNull();
  });

  it('resolves TypeScript aliases based on tsconfig paths', () => {
    const srcDir = path.join(tmpRoot, 'src/platform');
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, 'storage.ts'), 'export const storage = {};');
    fs.writeFileSync(
      path.join(tmpRoot, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
          },
        },
      })
    );

    const consumerPath = path.join(tmpRoot, 'src/features/demo/index.ts');
    fs.mkdirSync(path.dirname(consumerPath), { recursive: true });
    fs.writeFileSync(consumerPath, "import { storage } from '@/platform/storage';");

    const resolved = resolveLocalModulePath('@/platform/storage', consumerPath, tmpRoot);
    expect(resolved).toBe('src/platform/storage.ts');
  });

  it('supports tsconfig inheritance via extends', () => {
    const baseConfig = path.join(tmpRoot, 'tsconfig.base.json');
    const childConfig = path.join(tmpRoot, 'tsconfig.json');

    fs.writeFileSync(
      baseConfig,
      JSON.stringify({
        compilerOptions: {
          paths: {
            '~/*': ['./shared/*'],
          },
        },
      })
    );

    fs.writeFileSync(
      childConfig,
      JSON.stringify({
        extends: './tsconfig.base.json',
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
          },
        },
      })
    );

    const loaded = loadTsConfig('tsconfig.json', tmpRoot);
    expect(loaded.paths['@/*']).toEqual(['./src/*']);
    expect(loaded.paths['~/*']).toEqual(['./shared/*']);
  });

  it('handles multiline imports with formatting breaks before from', () => {
    const code = `
      import {
        calculateDifference,
        formatDifferenceOutput,
        type DiffOptions,
      } from '../core/diff-calculator';
    `;

    const filePath = path.join(tmpRoot, 'multiline.ts');
    fs.writeFileSync(filePath, code);

    const deps = extractDependenciesFromSource(filePath, tmpRoot);

    expect(deps.length).toBe(1);
    expect(deps[0].moduleSpecifier).toBe('../core/diff-calculator');
    expect(deps[0].importedSymbols).toContain('calculateDifference');
    expect(deps[0].importedSymbols).toContain('formatDifferenceOutput');
  });

  it('identifies non-literal dynamic imports and logs a traceable diagnostic', () => {
    const code = `
      const runtimeModule = './dynamic-helper';
      export async function loadRuntime() {
        const mod = await import(runtimeModule);
        return mod;
      }
    `;

    const filePath = path.join(tmpRoot, 'dyn-expr.ts');
    fs.writeFileSync(filePath, code);

    const analysis = analyzeSourceFile(filePath, tmpRoot);

    expect(analysis.diagnostics.length).toBeGreaterThan(0);
    expect(analysis.diagnostics[0].type).toBe('NON_LITERAL_DYNAMIC_IMPORT');
    expect(analysis.diagnostics[0].message).toContain('não literal');
  });

  it('reports unresolved modules clearly with resolveModule', () => {
    const filePath = path.join(tmpRoot, 'test.ts');
    fs.writeFileSync(filePath, "import { a } from './non-existent';");

    const resolution = resolveModule('./non-existent', filePath, { projectRoot: tmpRoot });

    expect(resolution.status).toBe('unresolved');
    expect(resolution.isLocal).toBe(true);
    expect(resolution.isExternal).toBe(false);
    expect(resolution.resolvedPath).toBeNull();
    expect(resolution.error).toContain('não encontrado');
  });

  it('throws an error when analyzing a non-existent file', () => {
    expect(() => {
      extractDependenciesFromSource(path.join(tmpRoot, 'missing.ts'), tmpRoot);
    }).toThrow('Arquivo inexistente');
  });
});
