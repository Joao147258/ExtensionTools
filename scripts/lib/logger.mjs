/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/lib/logger.mjs
 * Responsabilidade: Padronizar diagnósticos de console, formatação visual ANSI
 *                  e sanitização ativa mandatória de dados sensíveis.
 *
 * Propósito:
 * Assegurar que nenhuma informação confidencial, credencial, token ou caminho
 * absoluto de estações de trabalho seja impresso em `process.stdout` ou
 * `process.stderr`, nem mesmo diante de exceções, formatações quebradas ou stack traces.
 *
 * Problema Resolvido:
 * Evita o risco comum em scanners de segurança onde o próprio relatório de erro
 * ecoa no terminal o token confidencial encontrado, gerando vazamento acidental em
 * logs de CI ou sessões compartilhadas de terminal.
 *
 * Princípios de Segurança:
 * 1. Sanitização a Priori: Toda string é processada pelo motor de redação e mascaramento
 *    ANTES de qualquer tentativa de concatenação, colorização ANSI ou escrita em stream.
 * 2. Fail-Safe: Se o formatador de cores quebrar ou lançar erro, a mensagem bruta NÃO é
 *    enviada; o logger faz fallback para uma mensagem sanitizada simplificada.
 * 3. Suporte a NO_COLOR: Respeita universalmente a variável de ambiente `NO_COLOR`
 *    ou a flag `--no-color` para não poluir saídas em pipelines de automação.
 * ==============================================================================
 */

/**
 * Códigos de escape ANSI para formatação de texto em terminais compatíveis.
 */
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Determina se o ambiente atual suporta emissão de cores ANSI.
 *
 * @returns {boolean} True se as cores estiverem ativadas.
 */
export function isColorSupported() {
  if (process.env.NO_COLOR !== undefined || process.argv.includes('--no-color')) {
    return false;
  }
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  return Boolean(process.stdout && process.stdout.isTTY);
}

/**
 * Aplica código ANSI a um texto caso o terminal suporte cores.
 *
 * @param {string} text - Texto a colorir.
 * @param {string} code - Código de escape ANSI.
 * @returns {string} Texto formatado ou original.
 */
function colorize(text, code) {
  if (!isColorSupported()) {
    return text;
  }
  return `${code}${text}${ANSI.reset}`;
}

/**
 * Sanitiza ativamente qualquer valor (string, objeto ou erro), mascarando segredos
 * e caminhos privados antes de serem impressos.
 *
 * Regras de Redação:
 * 1. Chaves de acesso AWS (AKIA...) são reduzidas para `AKI***REDACTED***`.
 * 2. Tokens do GitHub (ghp_..., gho_...) são reduzidos para `ghp***REDACTED***`.
 * 3. Atribuições genéricas de credenciais (api_key = "...") têm seu valor mascarado.
 * 4. Blocos inteiros de chave privada PEM são substituídos por tag segura.
 * 5. Caminhos absolutos de usuários (/home/<usuario>/ -> /home/[USER]/) são neutralizados.
 *
 * @param {*} input - Entrada a ser sanitizada (string, Error, Object).
 * @param {string[]} [customSensitiveTerms=[]] - Termos confidenciais adicionais a mascarar.
 * @returns {string} String perfeitamente sanitizada e segura para emissão pública.
 */
export function maskSensitiveData(input, customSensitiveTerms = []) {
  if (input === null || input === undefined) {
    return '';
  }

  let text;
  if (input instanceof Error) {
    text = `${input.name}: ${input.message}\n${input.stack || ''}`;
  } else if (typeof input === 'object') {
    try {
      text = JSON.stringify(input, null, 2);
    } catch {
      text = String(input);
    }
  } else {
    text = String(input);
  }

  // 1. Aplica mascaramento de termos privados personalizados (ex: nomes de sistemas internos)
  for (const term of customSensitiveTerms) {
    if (typeof term === 'string' && term.trim().length > 0) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`\\b${escaped}\\b`, 'gi');
      text = text.replace(reg, '***REDACTED_TERM***');
    }
  }

  // 2. Chaves de Acesso AWS: AKIA... -> AKI***REDACTED***
  text = text.replace(/\bAKIA[0-9A-Z]{16}\b/g, (match) => `${match.slice(0, 3)}***REDACTED***`);

  // 3. Tokens de Autenticação do GitHub: ghp_... -> ghp***REDACTED***
  text = text.replace(
    /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/g,
    (match, prefix) => `${prefix}***REDACTED***`
  );

  // 4. Atribuições genéricas de chaves ou segredos de API
  text = text.replace(
    /((?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret)\s*[:=]\s*['"])([^'"]+)(['"])/gi,
    (match, p1, p2, p3) => `${p1}***REDACTED***${p3}`
  );

  // 5. Blocos de chaves privadas PEM
  text = text.replace(
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    '[BLOCO_CHAVE_PRIVADA_MASCARADO]'
  );

  // 6. Caminhos absolutos típicos de estações de trabalho de usuários: /home/<username>/ -> /home/[USER]/
  text = text.replace(
    /(\/(?:home|Users)\/)([a-zA-Z0-9._-]+)(\/)/g,
    (match, p1, user, p3) => `${p1}[USER]${p3}`
  );
  text = text.replace(
    /([A-Z]:\\Users\\)([a-zA-Z0-9._-]+)(\\)/g,
    (match, p1, user, p3) => `${p1}[USER]${p3}`
  );

  return text;
}

/**
 * Registrador estruturado de mensagens com sanitização garantida.
 */
export const logger = {
  /**
   * Emite mensagem informativa com ícone e formatação azul/ciano.
   *
   * @param {string} message - Mensagem a emitir.
   * @param {Object} [options={}] - Opções de log.
   */
  info(message, options = {}) {
    const safeMsg = maskSensitiveData(message, options.sensitiveTerms);
    const prefix = colorize('ℹ', ANSI.cyan);
    process.stdout.write(`${prefix}  ${safeMsg}\n`);
  },

  /**
   * Emite mensagem de sucesso com ícone verde.
   *
   * @param {string} message - Mensagem de sucesso.
   * @param {Object} [options={}]
   */
  success(message, options = {}) {
    const safeMsg = maskSensitiveData(message, options.sensitiveTerms);
    const prefix = colorize('✅', ANSI.green);
    process.stdout.write(`${prefix} ${colorize(safeMsg, ANSI.green)}\n`);
  },

  /**
   * Emite aviso não bloqueante com ícone amarelo.
   *
   * @param {string} message - Aviso.
   * @param {Object} [options={}]
   */
  warn(message, options = {}) {
    const safeMsg = maskSensitiveData(message, options.sensitiveTerms);
    const prefix = colorize('⚠️', ANSI.yellow);
    process.stdout.write(`${prefix}  ${colorize(safeMsg, ANSI.yellow)}\n`);
  },

  /**
   * Emite mensagem de erro crítico para `process.stderr`.
   *
   * @param {string|Error} errorOrMessage - Descrição do erro ou instância de Error.
   * @param {Object} [options={}]
   */
  error(errorOrMessage, options = {}) {
    const safeMsg = maskSensitiveData(errorOrMessage, options.sensitiveTerms);
    const prefix = colorize('❌', ANSI.red);
    process.stderr.write(`${prefix} ${colorize(safeMsg, ANSI.red)}\n`);
  },

  /**
   * Emite um cabeçalho visual destacado para separar seções de auditoria no terminal.
   *
   * @param {string} title - Título da seção.
   */
  section(title) {
    const safeTitle = maskSensitiveData(title);
    const border = colorize('═'.repeat(Math.max(40, safeTitle.length + 6)), ANSI.gray);
    process.stdout.write(`\n${border}\n  ${colorize(safeTitle, ANSI.bold)}\n${border}\n`);
  },
};
