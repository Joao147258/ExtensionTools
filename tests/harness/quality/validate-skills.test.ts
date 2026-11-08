/**
 * @file validate-skills.test.ts
 * @description Suíte de testes unitários e de integração negativa para o validador scripts/quality/validate-skills.mjs.
 * Garante que o validador detecte ausência de frontmatter, seções faltantes, caminhos privados e incompatibilidades.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseFrontmatter,
  validateSingleSkill,
  validateAllSkills,
} from '../../../scripts/quality/validate-skills.mjs';

describe('Validador Estrutural de Skills (validate-skills.mjs)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-val-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas de cleanup temporário
    }
  });

  describe('Função parseFrontmatter', () => {
    it('deve extrair campos "name" e "description" com sucesso', () => {
      const markdown = `---
name: minha-skill
description: >-
  Esta é a descrição detalhada da skill.
---
# Conteúdo`;

      const { frontmatter, error } = parseFrontmatter(markdown);
      expect(error).toBeNull();
      expect(frontmatter?.name).toBe('minha-skill');
      expect(frontmatter?.description).toContain('Esta é a descrição detalhada da skill.');
    });

    it('deve retornar erro quando o frontmatter não inicia com "---"', () => {
      const markdown = '# Apenas título sem frontmatter';
      const { frontmatter, error } = parseFrontmatter(markdown);
      expect(frontmatter).toBeNull();
      expect(error).toContain('não inicia com delimitador');
    });

    it('deve retornar erro quando o frontmatter não possui delimitador de fechamento', () => {
      const markdown = `---
name: skill-aberta
description: sem fechamento`;
      const { frontmatter, error } = parseFrontmatter(markdown);
      expect(frontmatter).toBeNull();
      expect(error).toContain('não foi encontrado');
    });
  });

  describe('Validação Negativa de Skill Individual (validateSingleSkill)', () => {
    it('deve reportar SKILL_FILE_MISSING quando o arquivo SKILL.md não existir', () => {
      const skillFolder = path.join(tmpDir, 'teste-ausente');
      fs.mkdirSync(skillFolder, { recursive: true });

      const violations = validateSingleSkill(skillFolder, 'teste-ausente');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].rule).toBe('SKILL_FILE_MISSING');
    });

    it('deve reportar NAME_MISMATCH quando o nome no frontmatter divergir da pasta', () => {
      const skillFolder = path.join(tmpDir, 'pasta-real');
      fs.mkdirSync(skillFolder, { recursive: true });

      const content = `---
name: outro-nome
description: Descrição suficiente para teste de integridade.
---
## 1. Identificação e Metadados Canônicos
## 2. Propósito e Problema Resolvido
## 3. Escopo e Fronteiras de Atuação
## 4. Condições de Ativação e Não Ativação
## 5. Pré-requisitos Técnicos Mandatórios
## 6. Fontes de Verdade e Referências Normativas
## 7. Contrato de Entrada (Input Contract)
## 8. Contrato de Saída e Entregáveis (Output Contract)
## 9. Procedimento Operacional Passo a Passo
## 10. Ferramentas, Comandos e Integrações Permitidas
## 12. Matriz de Tratamento de Erros e Exceções
## 13. Política de Evidências e Anti-Alucinação
## 15. Critérios de Aceitação da Execução da Skill
`;
      fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), content);

      const violations = validateSingleSkill(skillFolder, 'pasta-real');
      const mismatch = violations.find((v) => v.rule === 'NAME_MISMATCH');
      expect(mismatch).toBeDefined();
    });

    it('deve reportar MISSING_REQUIRED_SECTION quando faltar seção essencial', () => {
      const skillFolder = path.join(tmpDir, 'skill-incompleta');
      fs.mkdirSync(skillFolder, { recursive: true });

      const content = `---
name: skill-incompleta
description: Descrição suficiente para teste de integridade.
---
## 1. Identificação e Metadados Canônicos
# Faltam as demais seções obrigatórias
`;
      fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), content);

      const violations = validateSingleSkill(skillFolder, 'skill-incompleta');
      const missing = violations.filter((v) => v.rule === 'MISSING_REQUIRED_SECTION');
      expect(missing.length).toBeGreaterThan(0);
    });

    it('deve reportar PRIVATE_PATH_DETECTED quando houver caminho de filesystem local', () => {
      const skillFolder = path.join(tmpDir, 'skill-com-caminho-privado');
      fs.mkdirSync(skillFolder, { recursive: true });

      const content = `---
name: skill-com-caminho-privado
description: Descrição suficiente para teste de integridade.
---
## 1. Identificação e Metadados Canônicos
## 2. Propósito e Problema Resolvido
## 3. Escopo e Fronteiras de Atuação
## 4. Condições de Ativação e Não Ativação
## 5. Pré-requisitos Técnicos Mandatórios
## 6. Fontes de Verdade e Referências Normativas
## 7. Contrato de Entrada (Input Contract)
## 8. Contrato de Saída e Entregáveis (Output Contract)
## 9. Procedimento Operacional Passo a Passo
## 10. Ferramentas, Comandos e Integrações Permitidas
## 12. Matriz de Tratamento de Erros e Exceções
## 13. Política de Evidências e Anti-Alucinação
## 15. Critérios de Aceitação da Execução da Skill

Exemplo com caminho proibido: ${['', 'home', 'usuario', 'DeveloperLabTools', 'arquivo.txt'].join('/')}
`;
      fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), content);

      const violations = validateSingleSkill(skillFolder, 'skill-com-caminho-privado');
      const pathViolation = violations.find((v) => v.rule === 'PRIVATE_PATH_DETECTED');
      expect(pathViolation).toBeDefined();
    });
  });

  describe('Validação Completa (validateAllSkills)', () => {
    it('deve aprovar quando todas as skills presentes forem válidas', () => {
      const skillFolder = path.join(tmpDir, 'minha-skill');
      fs.mkdirSync(skillFolder, { recursive: true });

      const content = `---
name: minha-skill
description: Descrição válida e completa com orientação de ativação.
---
## 1. Identificação e Metadados Canônicos
## 2. Propósito e Problema Resolvido
## 3. Escopo e Fronteiras de Atuação
## 4. Condições de Ativação e Não Ativação
## 5. Pré-requisitos Técnicos Mandatórios
## 6. Fontes de Verdade e Referências Normativas
## 7. Contrato de Entrada (Input Contract)
## 8. Contrato de Saída e Entregáveis (Output Contract)
## 9. Procedimento Operacional Passo a Passo
## 10. Ferramentas, Comandos e Integrações Permitidas
## 12. Matriz de Tratamento de Erros e Exceções
## 13. Política de Evidências e Anti-Alucinação
## 15. Critérios de Aceitação da Execução da Skill
`;
      fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), content);

      const res = validateAllSkills(tmpDir, { skillsList: ['minha-skill'] });
      expect(res.passed).toBe(true);
      expect(res.violations.length).toBe(0);
    });
  });
});
