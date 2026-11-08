/**
 * @file validate-skills.mjs
 * @description Validador estrutural e normativo das skills canônicas do harness ExtensionTools.
 * Verifica existência dos 9 arquivos SKILL.md, frontmatter YAML, seções obrigatórias,
 * ausência de caminhos absolutos privados e conformidade com os contratos do projeto.
 *
 * Códigos de saída (Exit codes):
 * - 0: Todas as skills são válidas e aprovadas sem violações.
 * - 1: Violação de contrato, frontmatter inválido, seção ausente ou caminho proibido.
 * - 2: Erro operacional interno ou parâmetros inválidos.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Lista canônica oficial das 9 skills previstas no marco M2-PHASE-2.
 */
export const CANONICAL_SKILLS = [
  'architecture-review',
  'code-review',
  'documentation',
  'implementation',
  'public-repository-safety',
  'release-validation',
  'script-development',
  'security-audit',
  'testing',
];

/**
 * Seções essenciais universais exigidas em cada arquivo SKILL.md.
 */
export const REQUIRED_SECTIONS = [
  '1. Identificação e Metadados Canônicos',
  '2. Propósito e Problema Resolvido',
  '3. Escopo e Fronteiras de Atuação',
  '4. Condições de Ativação e Não Ativação',
  '5. Pré-requisitos Técnicos Mandatórios',
  '6. Fontes de Verdade e Referências Normativas',
  '7. Contrato de Entrada (Input Contract)',
  '8. Contrato de Saída e Entregáveis (Output Contract)',
  '9. Procedimento Operacional Passo a Passo',
  '10. Ferramentas, Comandos e Integrações Permitidas',
  '12. Matriz de Tratamento de Erros e Exceções',
  '13. Política de Evidências e Anti-Alucinação',
  '15. Critérios de Aceitação da Execução da Skill',
];

/**
 * Extrai e valida o bloco de frontmatter YAML de um arquivo Markdown.
 *
 * @param {string} content - Conteúdo completo do arquivo Markdown.
 * @returns {{ frontmatter: Object|null, error: string|null }}
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: null, error: 'Arquivo não inicia com delimitador de frontmatter "---".' };
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return {
      frontmatter: null,
      error: 'Delimitador de fechamento de frontmatter "---" não foi encontrado.',
    };
  }

  const rawYaml = content.slice(3, endIndex).trim();
  const lines = rawYaml.split('\n');
  const frontmatter = {};

  let currentKey = null;
  let multilineValue = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        frontmatter[currentKey] = multilineValue.trim();
        multilineValue = '';
      }

      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();
      if (val === '>-' || val === '>' || val === '|') {
        multilineValue = '';
      } else {
        frontmatter[currentKey] = val.replace(/^["'](.*)["']$/, '$1');
        currentKey = null;
      }
    } else if (currentKey) {
      multilineValue += ' ' + trimmed;
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = multilineValue.trim();
  }

  return { frontmatter, error: null };
}

/**
 * Valida a integridade de uma skill individual no diretório especificado.
 *
 * @param {string} skillDir - Caminho absoluto para a pasta da skill.
 * @param {string} expectedName - Nome esperado em conformidade com o catálogo canônico.
 * @returns {Array<{ rule: string, details: string }>} Lista de violações encontradas.
 */
export function validateSingleSkill(skillDir, expectedName) {
  const violations = [];
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    violations.push({
      rule: 'SKILL_FILE_MISSING',
      details: `Arquivo canônico "SKILL.md" ausente no diretório: ${path.basename(skillDir)}`,
    });
    return violations;
  }

  let content;
  try {
    content = fs.readFileSync(skillFile, 'utf8');
  } catch (err) {
    violations.push({
      rule: 'SKILL_READ_ERROR',
      details: `Falha ao ler arquivo SKILL.md: ${err.message}`,
    });
    return violations;
  }

  // 1. Validação do Frontmatter
  const { frontmatter, error: fmError } = parseFrontmatter(content);
  if (fmError || !frontmatter) {
    violations.push({
      rule: 'INVALID_FRONTMATTER',
      details: fmError || 'Falha ao processar frontmatter YAML.',
    });
  } else {
    if (!frontmatter.name) {
      violations.push({
        rule: 'MISSING_NAME_FIELD',
        details: 'Campo obrigatório "name" ausente no frontmatter.',
      });
    } else if (frontmatter.name !== expectedName) {
      violations.push({
        rule: 'NAME_MISMATCH',
        details: `Campo "name" ("${frontmatter.name}") diverge do nome da pasta ("${expectedName}").`,
      });
    }

    if (!frontmatter.description) {
      violations.push({
        rule: 'MISSING_DESCRIPTION_FIELD',
        details: 'Campo obrigatório "description" ausente no frontmatter.',
      });
    } else if (frontmatter.description.length < 20) {
      violations.push({
        rule: 'DESCRIPTION_TOO_SHORT',
        details:
          'Campo "description" muito curto. Deve conter orientações claras de ativação em terceira pessoa.',
      });
    }
  }

  // 2. Validação das Seções Canônicas Obrigatórias
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(`## ${section}`)) {
      violations.push({
        rule: 'MISSING_REQUIRED_SECTION',
        details: `Seção obrigatória ausente no corpo Markdown: "## ${section}"`,
      });
    }
  }

  // 3. Prevenção de Vazamento de Caminhos Absolutos Privados
  const lines = content.split('\n');
  const privatePathPattern = /\/home\/[a-zA-Z0-9._-]+\/|C:\\Users\\[a-zA-Z0-9._-]+\\/i;
  for (let i = 0; i < lines.length; i++) {
    if (privatePathPattern.test(lines[i])) {
      violations.push({
        rule: 'PRIVATE_PATH_DETECTED',
        details: `Linha ${i + 1} contém caminho absoluto de estação local privada. Use caminhos relativos ao repositório.`,
      });
      break;
    }
  }

  return violations;
}

/**
 * Validador principal que orquestra a varredura de todas as skills canônicas.
 *
 * @param {string} skillsRoot - Diretório raiz que contém as subpastas das skills.
 * @param {Object} options - Opções adicionais de validação.
 * @returns {{ passed: boolean, totalChecked: number, violations: Array<Object> }}
 */
export function validateAllSkills(skillsRoot, options = {}) {
  const expectedSkills = options.skillsList || CANONICAL_SKILLS;
  const allViolations = [];
  let checkedCount = 0;

  for (const skillName of expectedSkills) {
    checkedCount++;
    const skillDir = path.join(skillsRoot, skillName);

    if (!fs.existsSync(skillDir)) {
      allViolations.push({
        skill: skillName,
        rule: 'SKILL_DIR_MISSING',
        details: `Diretório da skill não encontrado: ${skillName}`,
      });
      continue;
    }

    const violations = validateSingleSkill(skillDir, skillName);
    for (const v of violations) {
      allViolations.push({
        skill: skillName,
        ...v,
      });
    }
  }

  return {
    passed: allViolations.length === 0,
    totalChecked: checkedCount,
    violations: allViolations,
  };
}

// Execução em linha de comando (CLI)
if (process.argv[1] && process.argv[1].endsWith('validate-skills.mjs')) {
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), '.harness/skills');

  console.log(`🔍 [validate-skills] Iniciando validação estrutural das skills em: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`🚨 [validate-skills] Diretório alvo não existe: ${targetDir}`);
    process.exit(2);
  }

  const result = validateAllSkills(targetDir);

  if (!result.passed) {
    console.error(
      `\n❌ [validate-skills] Falhas encontradas na validação (${result.violations.length} violações):\n`
    );
    for (const v of result.violations) {
      console.error(`  - [${v.rule}] Skill: "${v.skill}" -> ${v.details}`);
    }
    console.error('\nPor favor, corrija os arquivos SKILL.md antes de prosseguir.\n');
    process.exit(1);
  } else {
    console.log(
      `\n✅ [validate-skills] Sucesso: Todas as ${result.totalChecked} skills foram auditadas e aprovadas com louvor.\n`
    );
    process.exit(0);
  }
}
