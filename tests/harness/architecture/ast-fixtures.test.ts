import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  extractDependenciesFromSource,
  resolveModule,
  resolveLocalModulePath,
  analyzeSourceFile,
  loadTsConfig,
} from '../../../scripts/lib/ast-analyzer.mjs';
import { DependencyGraph, buildDependencyGraph } from '../../../scripts/lib/dependency-graph.mjs';

describe('ARC-FIX — Architectural Fixtures Integration Tests', () => {
  const fixturesRoot = path.resolve('tests/harness/fixtures/architecture');
  const validTsConfigPath = path.join(fixturesRoot, 'tsconfig.json');

  describe('Cenários Válidos', () => {
    it('extrai imports e reexports com resolução de aliases no fluxo válido', () => {
      const entrypointFile = path.join(fixturesRoot, 'valid/entrypoints/sidepanel.ts');
      const deps = extractDependenciesFromSource(entrypointFile, fixturesRoot);

      expect(deps.length).toBe(2);
      expect(deps[0].moduleSpecifier).toBe('@/features/sample-tool/index');
      expect(deps[1].moduleSpecifier).toBe('@/platform/browser-adapter');

      // Resolução dos aliases utilizando o tsconfig da fixture
      const tsConfig = loadTsConfig(validTsConfigPath, fixturesRoot);

      const resolvedFeature = resolveLocalModulePath(
        deps[0].moduleSpecifier,
        entrypointFile,
        fixturesRoot,
        tsConfig
      );
      expect(resolvedFeature).toBe('valid/features/sample-tool/index.ts');

      const resolvedPlatform = resolveLocalModulePath(
        deps[1].moduleSpecifier,
        entrypointFile,
        fixturesRoot,
        tsConfig
      );
      expect(resolvedPlatform).toBe('valid/platform/browser-adapter.ts');
    });

    it('extrai imports multilinha e distingue imports exclusivamente de tipo em ToolPanel.tsx', () => {
      const panelFile = path.join(fixturesRoot, 'valid/features/sample-tool/ui/ToolPanel.tsx');
      const deps = extractDependenciesFromSource(panelFile, fixturesRoot);

      // 1. Import multilinha de Button
      const buttonDep = deps.find((d) => d.moduleSpecifier === './Button');
      expect(buttonDep).toBeDefined();
      expect(buttonDep?.importedSymbols).toContain('ActionButton');

      // 2. Import type de ToolConfig
      const typeDep = deps.find((d) => d.moduleSpecifier === '../core/types');
      expect(typeDep).toBeDefined();
      expect(typeDep?.isTypeOnly).toBe(true);
      expect(typeDep?.importedSymbols).toContain('ToolConfig');

      // 3. Import de alias @shared/utils
      const sharedDep = deps.find((d) => d.moduleSpecifier === '@shared/utils');
      expect(sharedDep).toBeDefined();
      expect(sharedDep?.importedSymbols).toContain('formatTimestamp');
    });

    it('constrói grafo acíclico a partir de todos os módulos válidos', () => {
      const validFiles = [
        path.join(fixturesRoot, 'valid/entrypoints/sidepanel.ts'),
        path.join(fixturesRoot, 'valid/features/sample-tool/index.ts'),
        path.join(fixturesRoot, 'valid/features/sample-tool/core/engine.ts'),
        path.join(fixturesRoot, 'valid/features/sample-tool/core/types.ts'),
        path.join(fixturesRoot, 'valid/features/sample-tool/ui/ToolPanel.tsx'),
        path.join(fixturesRoot, 'valid/features/sample-tool/ui/Button.tsx'),
        path.join(fixturesRoot, 'valid/platform/browser-adapter.ts'),
        path.join(fixturesRoot, 'valid/shared/utils.ts'),
        path.join(fixturesRoot, 'valid/isolated/standalone-module.ts'),
      ];

      const graph = buildDependencyGraph(validFiles, {
        projectRoot: fixturesRoot,
        tsConfigPath: validTsConfigPath,
      });

      expect(graph.hasCycles()).toBe(false);
      expect(graph.findCycles()).toEqual([]);

      // Validação de módulo isolado
      const isolated = graph.findIsolatedNodes();
      expect(isolated).toContain('valid/isolated/standalone-module.ts');
    });
  });

  describe('Cenários Inválidos e Problemáticos', () => {
    it('detecta alias inexistente com diagnóstico de não resolvido', () => {
      const brokenAliasFile = path.join(fixturesRoot, 'invalid/unresolved-alias/broken-alias.ts');
      const deps = extractDependenciesFromSource(brokenAliasFile, fixturesRoot);

      expect(deps.length).toBe(1);
      const resolution = resolveModule(deps[0].moduleSpecifier, brokenAliasFile, {
        projectRoot: fixturesRoot,
        tsConfigPath: validTsConfigPath,
      });

      expect(resolution.status).toBe('unresolved');
      expect(resolution.resolvedPath).toBeNull();
      expect(resolution.error).toContain('Alias TypeScript não pôde ser resolvido');
    });

    it('detecta dependência relativa inexistente no disco', () => {
      const brokenRelativeFile = path.join(
        fixturesRoot,
        'invalid/missing-dependency/broken-relative.ts'
      );
      const deps = extractDependenciesFromSource(brokenRelativeFile, fixturesRoot);

      expect(deps.length).toBe(1);
      const resolution = resolveModule(deps[0].moduleSpecifier, brokenRelativeFile, {
        projectRoot: fixturesRoot,
      });

      expect(resolution.status).toBe('unresolved');
      expect(resolution.resolvedPath).toBeNull();
      expect(resolution.error).toContain('não encontrado no disco');
    });

    it('detecta ciclo direto entre dois módulos (node-a <-> node-b)', () => {
      const directCycleFiles = [
        path.join(fixturesRoot, 'invalid/direct-cycle/node-a.ts'),
        path.join(fixturesRoot, 'invalid/direct-cycle/node-b.ts'),
      ];

      const graph = buildDependencyGraph(directCycleFiles, {
        projectRoot: fixturesRoot,
      });

      expect(graph.hasCycles()).toBe(true);
      const cycles = graph.findCycles();
      expect(cycles.length).toBe(1);
      expect(cycles[0].type).toBe('direct');
      expect(cycles[0].length).toBe(2);
      expect(cycles[0].pathString).toContain('node-a.ts -> invalid/direct-cycle/node-b.ts');
    });

    it('detecta ciclo transitivo entre três módulos (alpha -> beta -> gamma -> alpha)', () => {
      const transitiveCycleFiles = [
        path.join(fixturesRoot, 'invalid/transitive-cycle/alpha.ts'),
        path.join(fixturesRoot, 'invalid/transitive-cycle/beta.ts'),
        path.join(fixturesRoot, 'invalid/transitive-cycle/gamma.ts'),
      ];

      const graph = buildDependencyGraph(transitiveCycleFiles, {
        projectRoot: fixturesRoot,
      });

      expect(graph.hasCycles()).toBe(true);
      const cycles = graph.findCycles();
      expect(cycles.length).toBe(1);
      expect(cycles[0].type).toBe('transitive');
      expect(cycles[0].length).toBe(3);
    });

    it('emite diagnóstico para import dinâmico com argumento variável', () => {
      const dynFile = path.join(fixturesRoot, 'invalid/dynamic-non-literal/runtime-loader.ts');
      const analysis = analyzeSourceFile(dynFile, fixturesRoot);

      expect(analysis.diagnostics.length).toBe(1);
      expect(analysis.diagnostics[0].type).toBe('NON_LITERAL_DYNAMIC_IMPORT');
      expect(analysis.diagnostics[0].message).toContain('Dependência estática não determinável');
    });

    it('analisa arquivo com erro de sintaxe de forma segura sem crashar', () => {
      const brokenSyntaxFile = path.join(fixturesRoot, 'invalid/syntax-error/broken-syntax.ts');
      const analysis = analyzeSourceFile(brokenSyntaxFile, fixturesRoot);

      // Deve extrair com sucesso os imports que foram declarados antes da corrupção
      expect(analysis.dependencies.length).toBe(1);
      expect(analysis.dependencies[0].moduleSpecifier).toBe('./helper');
    });

    it('trata graciosamente configuração tsconfig corrompida', () => {
      const brokenConfigPath = path.join(
        fixturesRoot,
        'invalid/invalid-config/broken.tsconfig.json'
      );
      const loaded = loadTsConfig(brokenConfigPath, fixturesRoot);

      expect(loaded).toBeDefined();
      expect(loaded.paths).toEqual({});
      expect(loaded.error).toBeDefined();
    });
  });
});
