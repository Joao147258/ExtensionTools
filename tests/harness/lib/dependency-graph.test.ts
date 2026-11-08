import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DependencyGraph, buildDependencyGraph } from '../../../scripts/lib/dependency-graph.mjs';

describe('LIB-05 — dependency-graph.mjs Unit Tests', () => {
  let tmpRoot;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('correctly registers nodes and edges deterministically', () => {
    const graph = new DependencyGraph();

    graph.addNode('src/b.ts');
    graph.addNode('src/a.ts');
    graph.addEdge('src/a.ts', 'src/b.ts', { moduleSpecifier: './b', line: 10 });

    expect(graph.getAllNodeIds()).toEqual(['src/a.ts', 'src/b.ts']);
    expect(graph.getDependencies('src/a.ts')).toEqual(['src/b.ts']);
    expect(graph.getDependents('src/b.ts')).toEqual(['src/a.ts']);
    expect(graph.getDependencies('src/b.ts')).toEqual([]);
    expect(graph.hasCycles()).toBe(false);
  });

  it('unifies duplicate dependencies between the same modules', () => {
    const graph = new DependencyGraph();

    graph.addEdge('src/a.ts', 'src/b.ts', { line: 1 });
    graph.addEdge('src/a.ts', 'src/b.ts', { line: 5 });

    expect(graph.getDependencies('src/a.ts')).toEqual(['src/b.ts']);
    expect(graph.getAllEdges().length).toBe(2);
  });

  it('identifies isolated modules with no incoming or outgoing dependencies', () => {
    const graph = new DependencyGraph();

    graph.addEdge('src/entry.ts', 'src/feature.ts');
    graph.addNode('src/standalone.ts');
    graph.addNode('src/other-standalone.ts');

    const isolated = graph.findIsolatedNodes();
    expect(isolated).toEqual(['src/other-standalone.ts', 'src/standalone.ts']);
  });

  it('detects direct circular dependencies (A <-> B) with cycle path and type', () => {
    const graph = new DependencyGraph();

    graph.addEdge('src/alpha.ts', 'src/beta.ts');
    graph.addEdge('src/beta.ts', 'src/alpha.ts');

    const cycles = graph.findCycles();

    expect(cycles.length).toBe(1);
    expect(cycles[0].type).toBe('direct');
    expect(cycles[0].length).toBe(2);
    expect(cycles[0].cycle).toEqual(['src/alpha.ts', 'src/beta.ts', 'src/alpha.ts']);
    expect(cycles[0].pathString).toBe('src/alpha.ts -> src/beta.ts -> src/alpha.ts');
  });

  it('detects transitive circular dependencies (A -> B -> C -> A)', () => {
    const graph = new DependencyGraph();

    graph.addEdge('src/a.ts', 'src/b.ts');
    graph.addEdge('src/b.ts', 'src/c.ts');
    graph.addEdge('src/c.ts', 'src/a.ts');

    const cycles = graph.findCycles();

    expect(cycles.length).toBe(1);
    expect(cycles[0].type).toBe('transitive');
    expect(cycles[0].length).toBe(3);
    expect(cycles[0].cycle).toEqual(['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/a.ts']);
  });

  it('does not duplicate rotated representations of the same cycle', () => {
    const graph = new DependencyGraph();

    // Cria grafo fechado: z -> m -> a -> z
    graph.addEdge('src/z.ts', 'src/m.ts');
    graph.addEdge('src/m.ts', 'src/a.ts');
    graph.addEdge('src/a.ts', 'src/z.ts');

    const cycles = graph.findCycles();

    expect(cycles.length).toBe(1);
    // Ciclo normalizado deve iniciar pelo menor nó: src/a.ts
    expect(cycles[0].cycle[0]).toBe('src/a.ts');
    expect(cycles[0].cycle[3]).toBe('src/a.ts');
  });

  it('respects includeTypeOnly flag to distinguish runtime from compile-time cycles', () => {
    const graph = new DependencyGraph();

    graph.addEdge('src/model.ts', 'src/service.ts', { isTypeOnly: true });
    graph.addEdge('src/service.ts', 'src/model.ts', { isTypeOnly: false });

    // Por padrão (includeTypeOnly = false), não há ciclo em runtime
    expect(graph.hasCycles({ includeTypeOnly: false })).toBe(false);

    // Com includeTypeOnly = true, acusa o ciclo estático
    expect(graph.hasCycles({ includeTypeOnly: true })).toBe(true);
    const cycles = graph.findCycles({ includeTypeOnly: true });
    expect(cycles.length).toBe(1);
  });

  it('builds a complete graph from files on disk with relative imports and aliases', () => {
    const srcDir = path.join(tmpRoot, 'src');
    const featDir = path.join(srcDir, 'feature');
    const sharedDir = path.join(srcDir, 'shared');

    fs.mkdirSync(featDir, { recursive: true });
    fs.mkdirSync(sharedDir, { recursive: true });

    fs.writeFileSync(
      path.join(tmpRoot, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          paths: { '@/*': ['./src/*'] },
        },
      })
    );

    fs.writeFileSync(path.join(sharedDir, 'utils.ts'), 'export const noop = () => {};');
    fs.writeFileSync(
      path.join(featDir, 'core.ts'),
      "import { noop } from '@/shared/utils';\nexport const run = () => noop();"
    );
    fs.writeFileSync(
      path.join(srcDir, 'entry.ts'),
      "import { run } from './feature/core';\nrun();"
    );

    const files = [
      path.join(srcDir, 'entry.ts'),
      path.join(featDir, 'core.ts'),
      path.join(sharedDir, 'utils.ts'),
    ];

    const graph = buildDependencyGraph(files, {
      projectRoot: tmpRoot,
      tsConfigPath: path.join(tmpRoot, 'tsconfig.json'),
    });

    expect(graph.hasNode('src/entry.ts')).toBe(true);
    expect(graph.hasNode('src/feature/core.ts')).toBe(true);
    expect(graph.hasNode('src/shared/utils.ts')).toBe(true);

    expect(graph.getDependencies('src/entry.ts')).toEqual(['src/feature/core.ts']);
    expect(graph.getDependencies('src/feature/core.ts')).toEqual(['src/shared/utils.ts']);
    expect(graph.hasCycles()).toBe(false);
  });
});
