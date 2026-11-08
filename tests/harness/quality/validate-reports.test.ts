import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  isReportFileName,
  scanForDispersedReports,
  validateCanonicalReportsStructure,
  runReportsValidation,
} from '../../../scripts/quality/validate-reports.mjs';

describe('Governance Quality Gate: validate-reports.mjs', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reports-governance-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('isReportFileName', () => {
    it('identifica corretamente nomes padrão de relatórios', () => {
      expect(isReportFileName('RELATORIO-IMPLEMENTACAO.md')).toBe(true);
      expect(isReportFileName('H0-FOUNDATION-REPORT.md')).toBe(true);
      expect(isReportFileName('M2-PHASE-2-PLANEJAMENTO-SKILLS-CANONICAS.md')).toBe(true);
      expect(isReportFileName('RELATORIO-REVISAO-ARQUITETURAL.md')).toBe(true);
      expect(isReportFileName('RELATORIO-HOMOLOGACAO.md')).toBe(true);
      expect(isReportFileName('FASE-01-VALIDACAO-FINAL.md')).toBe(true);
    });

    it('rejeita arquivos de documentação técnica canônica comum', () => {
      expect(isReportFileName('ARCHITECTURE.md')).toBe(false);
      expect(isReportFileName('DESIGN.md')).toBe(false);
      expect(isReportFileName('README.md')).toBe(false);
      expect(isReportFileName('status.md')).toBe(false);
      expect(isReportFileName('index.ts')).toBe(false);
      expect(isReportFileName('button.tsx')).toBe(false);
    });
  });

  describe('scanForDispersedReports', () => {
    it('aprova quando nenhum relatório está disperso fora de docs/Relatorios', () => {
      // Cria estrutura canônica com relatórios
      const canonicalDir = path.join(tempDir, 'docs/Relatorios/m0');
      fs.mkdirSync(canonicalDir, { recursive: true });
      fs.writeFileSync(path.join(canonicalDir, 'H0-FOUNDATION-REPORT.md'), '# Relatório Válido');

      // Cria arquivos de código e docs técnicos legítimos fora
      const srcDir = path.join(tempDir, 'src/features/text-diff');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'index.ts'), 'export const diff = true;');

      const violations = scanForDispersedReports(tempDir, tempDir);
      expect(violations).toHaveLength(0);
    });

    it('detecta violação se um relatório for criado na raiz do projeto', () => {
      fs.writeFileSync(path.join(tempDir, 'RELATORIO-AVULSO.md'), '# Relatório Inválido na Raiz');

      const violations = scanForDispersedReports(tempDir, tempDir);
      expect(violations).toHaveLength(1);
      expect(violations[0].file).toBe('RELATORIO-AVULSO.md');
      expect(violations[0].reason).toContain('fora do diretório canônico');
    });

    it('detecta violação se um relatório for criado dentro de uma feature', () => {
      const featureDir = path.join(tempDir, 'src/features/investigation-board');
      fs.mkdirSync(featureDir, { recursive: true });
      fs.writeFileSync(path.join(featureDir, 'RELATORIO-IMPLEMENTACAO.md'), '# Relatório Inválido');

      const violations = scanForDispersedReports(tempDir, tempDir);
      expect(violations).toHaveLength(1);
      expect(violations[0].file).toBe(
        'src/features/investigation-board/RELATORIO-IMPLEMENTACAO.md'
      );
    });

    it('detecta violação se um relatório for criado na pasta legada docs/reports/', () => {
      const legacyDir = path.join(tempDir, 'docs/reports');
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(legacyDir, 'OLD-REPORT.md'), '# Relatório em pasta legada');

      const violations = scanForDispersedReports(tempDir, tempDir);
      expect(violations).toHaveLength(1);
      expect(violations[0].file).toBe('docs/reports/OLD-REPORT.md');
    });
  });

  describe('validateCanonicalReportsStructure', () => {
    it('reprova se docs/Relatorios não existir', () => {
      const result = validateCanonicalReportsStructure(tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Diretório canônico de relatórios não encontrado');
    });

    it('reprova se docs/Relatorios/README.md não existir', () => {
      fs.mkdirSync(path.join(tempDir, 'docs/Relatorios'), { recursive: true });
      const result = validateCanonicalReportsStructure(tempDir);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Arquivo de índice canônico ausente');
    });

    it('aprova se docs/Relatorios existir com seu README.md', () => {
      const reportsDir = path.join(tempDir, 'docs/Relatorios');
      fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(path.join(reportsDir, 'README.md'), '# Índice');

      const result = validateCanonicalReportsStructure(tempDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('runReportsValidation integrada', () => {
    it('executa a validação integrada com sucesso sobre o repositório atual', () => {
      const projectRoot = process.cwd();
      const result = runReportsValidation(projectRoot);

      expect(result.passed).toBe(true);
      expect(result.dispersedViolations).toHaveLength(0);
      expect(result.structureErrors).toHaveLength(0);
    });
  });
});
