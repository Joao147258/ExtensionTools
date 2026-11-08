import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runBoundaryLinter } from '../../../scripts/architecture/boundary-linter.mjs';
import {
  verifyModuleBoundaries,
  classifyModulePath,
} from '../../../scripts/architecture/verify-module-boundaries.mjs';

describe('ARC-LINT — Boundary Linter & Module Boundaries Tests (QG-02)', () => {
  const fixturesRoot = path.resolve('tests/harness/fixtures/architecture');
  const validTsConfig = path.join(fixturesRoot, 'tsconfig.json');
  const linterScriptPath = path.resolve('scripts/architecture/boundary-linter.mjs');

  describe('1. Classificação de Módulos (classifyModulePath)', () => {
    it('classifica corretamente entrypoints, features e subcamadas', () => {
      expect(classifyModulePath('src/entrypoints/sidepanel/main.ts').layer).toBe('entrypoints');

      const featCore = classifyModulePath('src/features/text-diff/core/engine.ts');
      expect(featCore.layer).toBe('features');
      expect(featCore.featureName).toBe('text-diff');
      expect(featCore.sublayer).toBe('core');
      expect(featCore.isPublicEntrypoint).toBe(false);

      const featIndex = classifyModulePath('src/features/text-diff/index.ts');
      expect(featIndex.layer).toBe('features');
      expect(featIndex.isPublicEntrypoint).toBe(true);

      const platformMod = classifyModulePath('src/platform/browser/storage.ts');
      expect(platformMod.layer).toBe('platform');

      const sharedMod = classifyModulePath('src/shared/utils/format.ts');
      expect(sharedMod.layer).toBe('shared');
    });
  });

  describe('2. Casos Positivos (Conformidade Arquitetural — Exit Code 0)', () => {
    it('aprova conjunto válido de fixtures com código de saída 0 e zero violações', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'valid'),
        tsConfigPath: validTsConfig,
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('PASS');
      expect(result.exitCode).toBe(0);
      expect(result.summary.totalViolations).toBe(0);
      expect(result.summary.cyclesCount).toBe(0);
      expect(result.summary.operationalErrorsCount).toBe(0);
      expect(result.violations).toEqual([]);
    });

    it('aprova escopo vazio retornando PASS sem falhas', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'valid/isolated'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('PASS');
      expect(result.exitCode).toBe(0);
      expect(result.violations).toEqual([]);
    });
  });

  describe('3. Casos Negativos — Regras ARC-R01 a ARC-R08 (Exit Code 1)', () => {
    it('ARC-R01: impede importação cruzada direta entre features distintas', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/cross-feature/features/feat-a/core.ts'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      expect(result.violations.some((v) => v.ruleId === 'ARC-R01')).toBe(true);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R01');
      expect(violation?.message).toContain(
        'Importação cruzada direta entre features não é permitida'
      );
      expect(violation?.remediation).toContain('src/platform/');
    });

    it('ARC-R02: impede que entrypoints acessem arquivos internos de features ignorando index.ts', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/internal-feature-access/entrypoints/panel.ts'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R02');
      expect(violation).toBeDefined();
      expect(violation?.message).toContain('Acesso ilegal a arquivo interno da feature');
    });

    it('ARC-R03: preserva pureza de Core/Domain contra React e componentes visuais de UI', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/domain-leak/features/math/core/calculator.ts'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const r03Violations = result.violations.filter((v) => v.ruleId === 'ARC-R03');
      expect(r03Violations.length).toBe(2);

      // 1. react import
      expect(r03Violations.some((v) => v.target === 'react')).toBe(true);
      // 2. ui component import
      expect(r03Violations.some((v) => v.target.includes('ui/Display'))).toBe(true);
    });

    it('ARC-R04: impede que Application importe diretamente infraestrutura em vez de interface', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(
          fixturesRoot,
          'invalid/application-infra/features/orders/application/process-order.ts'
        ),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R04');
      expect(violation).toBeDefined();
      expect(violation?.message).toContain('Violação de Inversão de Dependência em Application');
    });

    it('ARC-R05: impede que Shared importe de camadas superiores (Platform / Features)', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/shared-leak/shared/helpers.ts'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R05');
      expect(violation).toBeDefined();
      expect(violation?.message).toContain('Violação de isolamento de Shared');
    });

    it('ARC-R06: impede que Platform importe de Features ou Entrypoints', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/platform-leak/platform/service.ts'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R06');
      expect(violation).toBeDefined();
      expect(violation?.message).toContain('Violação de isolamento de Platform');
    });

    it('ARC-R07: detecta e bloqueia dependências circulares diretas (A <-> B)', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/direct-cycle'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const cycleViolation = result.violations.find((v) => v.ruleId === 'ARC-R07');
      expect(cycleViolation).toBeDefined();
      expect(cycleViolation?.message).toContain('ciclo direto com 2 módulos');
    });

    it('ARC-R07: detecta e bloqueia dependências circulares transitivas (alpha -> beta -> gamma -> alpha)', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/transitive-cycle'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const cycleViolation = result.violations.find((v) => v.ruleId === 'ARC-R07');
      expect(cycleViolation).toBeDefined();
      expect(cycleViolation?.message).toContain('ciclo transitivo com 3 módulos');
    });

    it('ARC-R08: impede que aliases (@/*) contornem limites arquiteturais', async () => {
      const aliasRoot = path.join(fixturesRoot, 'invalid/alias-violation');
      const result = await runBoundaryLinter({
        scope: path.join(aliasRoot, 'features/feat-x/core.ts'),
        tsConfigPath: path.join(aliasRoot, 'tsconfig.json'),
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R01');
      expect(violation).toBeDefined();
      expect(violation?.viaAlias).toBe(true);
    });

    it('ARC-R08: detecta alias TypeScript quebrado apontando para caminho inexistente', async () => {
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/unresolved-alias/broken-alias.ts'),
        tsConfigPath: validTsConfig,
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('FAIL');
      expect(result.exitCode).toBe(1);
      const violation = result.violations.find((v) => v.ruleId === 'ARC-R08');
      expect(violation).toBeDefined();
      expect(violation?.message).toContain('Alias TypeScript inválido ou não resolvido no disco');
    });
  });

  describe('4. Casos de Robustez e Erros Operacionais (Exit Code 2)', () => {
    it('retorna exit code 2 quando o caminho de escopo não existe', async () => {
      const result = await runBoundaryLinter({
        scope: 'caminho/completamente/inexistente/no/disco',
        projectRoot: fixturesRoot,
      });

      expect(result.status).toBe('ERROR');
      expect(result.exitCode).toBe(2);
      expect(result.summary.operationalErrorsCount).toBeGreaterThan(0);
      expect(result.operationalErrors[0]).toContain('não existe');
    });

    it('reporta erro operacional para tsconfig corrompido', async () => {
      const brokenConfig = path.join(fixturesRoot, 'invalid/invalid-config/broken.tsconfig.json');
      const result = await runBoundaryLinter({
        scope: path.join(fixturesRoot, 'invalid/invalid-config/consumer.ts'),
        tsConfigPath: brokenConfig,
        projectRoot: fixturesRoot,
      });

      expect(result.exitCode).toBe(2);
      expect(result.operationalErrors.some((e) => e.includes('tsconfig'))).toBe(true);
    });
  });

  describe('5. Execução CLI por Subprocesso (Contrato de Saída e Códigos 0, 1 e 2)', () => {
    it('executa com exit code 0 e formato JSON no modo válido', () => {
      const stdout = execFileSync(
        'node',
        [
          linterScriptPath,
          '--scope',
          path.join(fixturesRoot, 'valid'),
          '--tsconfig',
          validTsConfig,
          '--json',
        ],
        { encoding: 'utf8' }
      );

      const parsed = JSON.parse(stdout);
      expect(parsed.status).toBe('PASS');
      expect(parsed.exitCode).toBe(0);
      expect(parsed.summary.totalViolations).toBe(0);
    });

    it('executa com exit code 1 no modo com violação arquitetural', () => {
      try {
        execFileSync(
          'node',
          [linterScriptPath, '--scope', path.join(fixturesRoot, 'invalid/direct-cycle'), '--json'],
          { encoding: 'utf8' }
        );
        expect.unreachable('Deveria ter falhado com exit code 1');
      } catch (err: any) {
        expect(err.status).toBe(1);
        const parsed = JSON.parse(err.stdout.toString());
        expect(parsed.status).toBe('FAIL');
        expect(parsed.violations.length).toBeGreaterThan(0);
      }
    });

    it('executa com exit code 2 no modo com erro de escopo inexistente', () => {
      try {
        execFileSync('node', [linterScriptPath, '--scope', 'pasta/inexistente', '--json'], {
          encoding: 'utf8',
        });
        expect.unreachable('Deveria ter falhado com exit code 2');
      } catch (err: any) {
        expect(err.status).toBe(2);
        const parsed = JSON.parse(err.stdout.toString());
        expect(parsed.status).toBe('ERROR');
        expect(parsed.operationalErrors.length).toBeGreaterThan(0);
      }
    });
  });
});
