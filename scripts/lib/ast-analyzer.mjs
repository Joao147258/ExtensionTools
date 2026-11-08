/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/lib/ast-analyzer.mjs
 * Responsabilidade: Fornecer primitivas avançadas de análise sintática (AST),
 *                  extração de declarações de dependência (imports/reexports) e
 *                  resolução canônica de módulos locais e aliases TypeScript.
 *
 * Propósito:
 * Sustentar o Quality Gate `QG-02 — Architecture Boundaries` e os verificadores
 * de governança (`verify-module-boundaries.mjs` e `detect-circular-deps.mjs`).
 *
 * Princípios de Engenharia e Inovações (M2-PHASE-4 | Bloco 5):
 * 1. Análise Sintática Oficial por AST: Integração nativa com a TypeScript Compiler API
 *    para análise estruturada de nós (`ImportDeclaration`, `ExportDeclaration` e `CallExpression`),
 *    superando limitações do parsing puramente léxico e de expressões regulares.
 * 2. Imunidade a Falsos Positivos: Comentários (linha/bloco) e declarações falsas em strings
 *    literais são completamente ignorados pelo motor sintático do compilador.
 * 3. Identificação de Tipos (Type-Only): Diferenciação rigorosa entre imports/exports de
 *    tempo de execução e imports exclusivamente de tipos (`import type` / `export type`),
 *    permitindo análise precisa de dependências estáticas vs de runtime.
 * 4. Resolução Canônica de Aliases: Suporte completo à leitura e herança de `tsconfig.json`
 *    (`baseUrl`, `paths` como `@/*`), resolução por extensões de arquivo e pontos de entrada (`index.ts`).
 * 5. Detecção de Dinamismos e Diagnósticos: Identificação de chamadas a `import(...)` com argumentos
 *    literais e registro explícito de imports dinâmicos não literais com diagnósticos rastreáveis.
 * 6. Resiliência Operacional e Fallback Seguro: Mecanismo de contingência sintático caso a API
 *    nativa do compilador esteja inacessível, preservando 100% de compatibilidade retroativa.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizePath } from './fs-utils.mjs';

/**
 * Instância singleton compartilhada da TypeScript Compiler API (sync).
 * Mantida viva durante o ciclo do processo para maximizar performance em lote.
 * @type {any}
 */
let sharedTsApiInstance = null;
let sharedTsApiFailed = false;

/**
 * Obtém ou inicializa a instância compartilhada da TypeScript Compiler API.
 * Em caso de indisponibilidade do binário ou erro no runtime, marca falha e retorna null.
 *
 * @returns {any|null} Instância de API do TypeScript ou null se indisponível.
 */
export async function getSharedTsApi() {
  if (sharedTsApiFailed) {
    return null;
  }
  if (sharedTsApiInstance) {
    return sharedTsApiInstance;
  }

  try {
    const syncModule = await import('typescript/unstable/sync');
    if (syncModule && syncModule.API) {
      sharedTsApiInstance = new syncModule.API();
      return sharedTsApiInstance;
    }
  } catch {
    sharedTsApiFailed = true;
  }

  return null;
}

/**
 * Fecha e libera com segurança a instância compartilhada da TypeScript Compiler API.
 */
export function closeSharedTsApi() {
  if (sharedTsApiInstance) {
    try {
      sharedTsApiInstance.close();
    } catch {
      // Ignora falhas no encerramento de processos filhos já finalizados
    } finally {
      sharedTsApiInstance = null;
    }
  }
}

// Limpeza automática no encerramento do processo
process.on('exit', () => {
  closeSharedTsApi();
});

/**
 * Estrutura canônica de uma dependência sintática extraída de um arquivo de código-fonte.
 * @typedef {Object} ModuleDependency
 * @property {string} sourceFile - Caminho relativo do arquivo que contém a declaração.
 * @property {string} moduleSpecifier - Especificador do módulo (ex: './foo', '@/platform/storage').
 * @property {number} line - Linha da declaração no arquivo de origem (1-indexed).
 * @property {number} column - Coluna da declaração no arquivo de origem (1-indexed).
 * @property {boolean} isTypeOnly - True se for exclusivamente de tipo (`import type` ou `export type`).
 * @property {boolean} isDynamic - True se for import dinâmico (`import(...)`).
 * @property {boolean} isDynamicLiteral - True se for import dinâmico com argumento literal de string.
 * @property {boolean} isExport - True se for declaração de reexport (`export ... from`).
 * @property {string[]} importedSymbols - Símbolos nomeados e/ou default importados ou exportados.
 */

/**
 * Diagnóstico emitido durante a análise do código-fonte.
 * @typedef {Object} SourceDiagnostic
 * @property {string} type - Tipo do diagnóstico (ex: 'NON_LITERAL_DYNAMIC_IMPORT', 'SYNTAX_WARNING').
 * @property {string} message - Descrição detalhada do achado.
 * @property {number} line - Linha da ocorrência (1-indexed).
 * @property {number} column - Coluna da ocorrência (1-indexed).
 * @property {string} sourceFile - Arquivo de origem.
 */

/**
 * Resultado da resolução de um módulo em disco.
 * @typedef {Object} ModuleResolutionResult
 * @property {'resolved' | 'external' | 'unresolved'} status - Estado da resolução.
 * @property {string|null} resolvedPath - Caminho relativo normalizado se resolvido localmente.
 * @property {string|null} absolutePath - Caminho absoluto canônico se resolvido localmente.
 * @property {boolean} isExternal - True se for pacote de terceiros ou módulo do Node.js.
 * @property {boolean} isLocal - True se o módulo pertence ao repositório local.
 * @property {string|null} [error] - Detalhe do motivo caso a resolução falhe.
 */

/**
 * Cache em memória de arquivos tsconfig.json lidos e resolvidos.
 * @type {Map<string, TsConfigOptions>}
 */
const tsConfigCache = new Map();

/**
 * Opções resolvidas de configuração TypeScript.
 * @typedef {Object} TsConfigOptions
 * @property {string} configPath - Caminho absoluto do arquivo tsconfig.json.
 * @property {string} basePath - Diretório base para resolução de caminhos relativos.
 * @property {string|null} baseUrl - Configuração baseUrl normalizada.
 * @property {Record<string, string[]>} paths - Mapeamento de aliases para diretórios de destino.
 */

/**
 * Remove comentários de bloco e linha de uma string de JSONC (JSON with Comments).
 *
 * @param {string} text - Conteúdo bruto do JSON.
 * @returns {string} JSON sem comentários e sem vírgulas finais inválidas.
 */
function cleanJsonComments(text) {
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inLineComment) {
      if (char === '\n' || char === '\r') {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (char === '\\') {
        i++;
        if (i < text.length) result += text[i];
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    result += char;
  }

  // Remove vírgulas finais antes de chaves ou colchetes de fechamento (trailing commas)
  return result.replace(/,\s*([}\]])/g, '$1');
}

/**
 * Lê e carrega recursivamente as configurações de um tsconfig.json,
 * resolvendo herança (`extends`), `baseUrl` e mapeamentos de aliases (`paths`).
 *
 * @param {string} [configPath='tsconfig.json'] - Caminho relativo ou absoluto do arquivo tsconfig.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto.
 * @returns {TsConfigOptions} Configurações estruturadas e normalizadas.
 */
export function loadTsConfig(configPath = 'tsconfig.json', projectRoot = process.cwd()) {
  const fullConfigPath = path.isAbsolute(configPath)
    ? path.normalize(configPath)
    : path.resolve(projectRoot, configPath);

  if (tsConfigCache.has(fullConfigPath)) {
    return tsConfigCache.get(fullConfigPath);
  }

  if (!fs.existsSync(fullConfigPath)) {
    const fallback = {
      configPath: fullConfigPath,
      basePath: path.dirname(fullConfigPath),
      baseUrl: null,
      paths: {},
    };
    tsConfigCache.set(fullConfigPath, fallback);
    return fallback;
  }

  try {
    const rawContent = fs.readFileSync(fullConfigPath, 'utf8');
    const cleanedContent = cleanJsonComments(rawContent);
    const parsed = JSON.parse(cleanedContent);

    let mergedPaths = {};
    let mergedBaseUrl = null;
    const configDir = path.dirname(fullConfigPath);

    // Trata herança através de "extends"
    if (typeof parsed.extends === 'string') {
      const parentRelPath = parsed.extends.endsWith('.json')
        ? parsed.extends
        : `${parsed.extends}.json`;
      const parentFullPath = path.resolve(configDir, parentRelPath);
      const parentConfig = loadTsConfig(parentFullPath, projectRoot);

      mergedPaths = { ...parentConfig.paths };
      mergedBaseUrl = parentConfig.baseUrl;
    }

    const compilerOptions = parsed.compilerOptions || {};

    if (compilerOptions.baseUrl !== undefined) {
      mergedBaseUrl = compilerOptions.baseUrl;
    }

    if (compilerOptions.paths && typeof compilerOptions.paths === 'object') {
      mergedPaths = { ...mergedPaths, ...compilerOptions.paths };
    }

    const resolved = {
      configPath: fullConfigPath,
      basePath: configDir,
      baseUrl: mergedBaseUrl,
      paths: mergedPaths,
    };

    tsConfigCache.set(fullConfigPath, resolved);
    return resolved;
  } catch (error) {
    const errorFallback = {
      configPath: fullConfigPath,
      basePath: path.dirname(fullConfigPath),
      baseUrl: null,
      paths: {},
      error: error.message,
    };
    tsConfigCache.set(fullConfigPath, errorFallback);
    return errorFallback;
  }
}

/**
 * Limpa o cache de configurações TypeScript.
 */
export function clearTsConfigCache() {
  tsConfigCache.clear();
}

/**
 * Extensões de arquivos suportadas para resolução de módulos, em ordem de precedência canônica do TypeScript.
 */
export const SUPPORTED_EXTENSIONS = [
  '',
  '.ts',
  '.tsx',
  '.d.ts',
  '.js',
  '.jsx',
  '/index.ts',
  '/index.tsx',
  '/index.d.ts',
  '/index.js',
  '/index.jsx',
];

/**
 * Verifica se um caminho base com extensões candidatas corresponde a um arquivo existente no disco.
 *
 * @param {string} basePathWithoutExt - Caminho base absoluto ou relativo para testar.
 * @returns {string|null} Caminho absoluto do arquivo encontrado ou null se nenhum existir.
 */
function probeExistingFile(basePathWithoutExt) {
  for (const ext of SUPPORTED_EXTENSIONS) {
    const candidate = `${basePathWithoutExt}${ext}`;
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Ignora erros de permissão ou caminho inválido no probe
    }
  }
  return null;
}

/**
 * Casa um module specifier contra os padrões de `paths` do TypeScript (incluindo wildcards `*`).
 *
 * @param {string} moduleSpecifier - Especificador do módulo (ex: '@/platform/storage').
 * @param {Record<string, string[]>} paths - Mapeamento de paths do tsconfig.
 * @param {string} basePath - Diretório base de resolução dos caminhos do tsconfig.
 * @returns {string|null} Caminho absoluto do arquivo resolvido no disco ou null se não casar.
 */
function resolvePathMapping(moduleSpecifier, paths, basePath) {
  if (!paths || typeof paths !== 'object') {
    return null;
  }

  for (const [pattern, targets] of Object.entries(paths)) {
    if (!Array.isArray(targets)) continue;

    const starIndex = pattern.indexOf('*');

    if (starIndex !== -1) {
      const prefix = pattern.slice(0, starIndex);
      const suffix = pattern.slice(starIndex + 1);

      if (moduleSpecifier.startsWith(prefix) && moduleSpecifier.endsWith(suffix)) {
        const wildcardContent = moduleSpecifier.slice(
          prefix.length,
          moduleSpecifier.length - suffix.length
        );

        for (const targetPattern of targets) {
          const targetSubstituted = targetPattern.replace('*', wildcardContent);
          const absoluteCandidate = path.resolve(basePath, targetSubstituted);
          const probed = probeExistingFile(absoluteCandidate);
          if (probed) {
            return probed;
          }
        }
      }
    } else if (moduleSpecifier === pattern) {
      for (const target of targets) {
        const absoluteCandidate = path.resolve(basePath, target);
        const probed = probeExistingFile(absoluteCandidate);
        if (probed) {
          return probed;
        }
      }
    }
  }

  return null;
}

/**
 * Resolve completamente um module specifier, diferenciando dependências externas de módulos
 * locais, respeitando caminhos relativos e aliases TypeScript.
 *
 * @param {string} moduleSpecifier - Especificador importado (ex: './diff', '@/platform/storage', 'react').
 * @param {string} sourceFilePath - Arquivo de origem onde a importação ocorre.
 * @param {Object} [options={}] - Opções de resolução.
 * @param {string} [options.projectRoot=process.cwd()] - Raiz do projeto.
 * @param {string} [options.tsConfigPath='tsconfig.json'] - Caminho do tsconfig a utilizar.
 * @param {TsConfigOptions} [options.tsConfig=null] - Instância pré-carregada do tsconfig.
 * @returns {ModuleResolutionResult} Diagnóstico estruturado da resolução do módulo.
 */
export function resolveModule(moduleSpecifier, sourceFilePath, options = {}) {
  const { projectRoot = process.cwd(), tsConfigPath = 'tsconfig.json', tsConfig = null } = options;

  if (typeof moduleSpecifier !== 'string' || !moduleSpecifier.trim()) {
    return {
      status: 'unresolved',
      resolvedPath: null,
      absolutePath: null,
      isExternal: false,
      isLocal: false,
      error: 'Especificador de módulo vazio ou inválido',
    };
  }

  const specifier = moduleSpecifier.trim();

  // 1. Identificação de módulos nativos do Node.js ou pacotes externos absolutos
  if (specifier.startsWith('node:')) {
    return {
      status: 'external',
      resolvedPath: null,
      absolutePath: null,
      isExternal: true,
      isLocal: false,
    };
  }

  const absoluteSource = path.isAbsolute(sourceFilePath)
    ? sourceFilePath
    : path.resolve(projectRoot, sourceFilePath);

  const sourceDir = path.dirname(absoluteSource);

  // 2. Resolução de caminhos relativos ou absolutos locais
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const basePath = specifier.startsWith('/')
      ? path.resolve(projectRoot, specifier.slice(1))
      : path.resolve(sourceDir, specifier);

    const probed = probeExistingFile(basePath);
    if (probed) {
      const relPath = normalizePath(path.relative(projectRoot, probed));
      return {
        status: 'resolved',
        resolvedPath: relPath,
        absolutePath: probed,
        isExternal: false,
        isLocal: true,
      };
    }

    return {
      status: 'unresolved',
      resolvedPath: null,
      absolutePath: null,
      isExternal: false,
      isLocal: true,
      error: `Módulo local relativo não encontrado no disco: "${specifier}" a partir de "${sourceFilePath}"`,
    };
  }

  // 3. Resolução por aliases TypeScript (paths) e baseUrl
  const config = tsConfig || loadTsConfig(tsConfigPath, projectRoot);

  if (config && config.paths && Object.keys(config.paths).length > 0) {
    const resolvedFromPaths = resolvePathMapping(specifier, config.paths, config.basePath);
    if (resolvedFromPaths) {
      const relPath = normalizePath(path.relative(projectRoot, resolvedFromPaths));
      return {
        status: 'resolved',
        resolvedPath: relPath,
        absolutePath: resolvedFromPaths,
        isExternal: false,
        isLocal: true,
      };
    }
  }

  if (config && config.baseUrl) {
    const baseDir = path.resolve(config.basePath, config.baseUrl);
    const candidateBase = path.resolve(baseDir, specifier);
    const probed = probeExistingFile(candidateBase);
    if (probed) {
      const relPath = normalizePath(path.relative(projectRoot, probed));
      return {
        status: 'resolved',
        resolvedPath: relPath,
        absolutePath: probed,
        isExternal: false,
        isLocal: true,
      };
    }
  }

  // Se o specifier usa convenção de alias típica (@/ ou ~/) mas não resolveu no disco:
  if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
    return {
      status: 'unresolved',
      resolvedPath: null,
      absolutePath: null,
      isExternal: false,
      isLocal: true,
      error: `Alias TypeScript não pôde ser resolvido para arquivo existente: "${specifier}"`,
    };
  }

  // 4. Pacote de terceiro (npm / node_modules)
  return {
    status: 'external',
    resolvedPath: null,
    absolutePath: null,
    isExternal: true,
    isLocal: false,
  };
}

/**
 * Resolve o caminho de arquivo em disco correspondente a um module specifier,
 * respeitando caminhos relativos, convenções de extensão e aliases TypeScript.
 *
 * Mantém 100% de compatibilidade retroativa com a API histórica do projeto.
 *
 * @param {string} moduleSpecifier - Especificador importado (ex: './utils', '@/platform/storage').
 * @param {string} sourceFilePath - Caminho do arquivo onde o import ocorre.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto.
 * @param {TsConfigOptions} [tsConfig=null] - Configuração tsconfig pré-carregada opcional.
 * @returns {string|null} Caminho relativo normalizado do arquivo resolvido em disco ou null se externo/não resolvido.
 */
export function resolveLocalModulePath(
  moduleSpecifier,
  sourceFilePath,
  projectRoot = process.cwd(),
  tsConfig = null
) {
  const result = resolveModule(moduleSpecifier, sourceFilePath, {
    projectRoot,
    tsConfig,
  });

  if (result.status === 'resolved' && result.isLocal) {
    return result.resolvedPath;
  }

  return null;
}

/**
 * Remove comentários de bloco e linha do código-fonte preservando rigorosamente
 * a contagem de linhas e o alinhamento de caracteres (substituindo o conteúdo por espaços).
 *
 * @param {string} text - Código-fonte original.
 * @returns {string} Código limpo com mesmo número de linhas e colunas.
 */
function stripCommentsPreservingLayout(text) {
  let result = '';
  let inString = false;
  let stringDelim = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inLineComment) {
      if (c === '\n') {
        inLineComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        result += '  ';
        i++;
      } else if (c === '\n') {
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (inString) {
      result += c;
      if (c === '\\') {
        i++;
        if (i < text.length) result += text[i];
      } else if (c === stringDelim) {
        inString = false;
      }
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      inString = true;
      stringDelim = c;
      result += c;
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      result += '  ';
      i++;
      continue;
    }

    if (c === '/' && next === '*') {
      inBlockComment = true;
      result += '  ';
      i++;
      continue;
    }

    result += c;
  }
  return result;
}

/**
 * Realiza a análise sintática de um arquivo utilizando o fallback estruturado
 * via regex e máquina de estados sobre texto limpo de comentários.
 *
 * @param {string} content - Conteúdo textual do código-fonte.
 * @param {string} relPath - Caminho relativo normalizado do arquivo.
 * @returns {{ dependencies: ModuleDependency[], diagnostics: SourceDiagnostic[] }}
 */
function extractWithLexicalFallback(content, relPath) {
  const deps = [];
  const diagnostics = [];

  // 1. Limpa comentários preservando o layout de linhas e colunas
  const cleanCode = stripCommentsPreservingLayout(content);

  // 2. Extração de imports e reexports estáticos (suportando multiline)
  // Regex para static import com cláusula multilinha: import ... from '...'
  const staticImportRegex =
    /(?:^|[;\n])\s*import\s+(?:type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = staticImportRegex.exec(cleanCode)) !== null) {
    const fullMatch = match[0];
    const rawClause = match[1];
    const specifier = match[2];
    const isTypeOnly = /^\s*(?:[;\n]\s*)?import\s+type\b/.test(fullMatch);

    // Ignora ocorrências simuladas em declarações de strings
    const matchIndex = match.index;
    const prefix = cleanCode.slice(Math.max(0, matchIndex - 50), matchIndex);
    if (/(?:const|let|var)\s+\w+\s*=\s*$/.test(prefix.trim())) {
      continue;
    }

    const line = cleanCode.slice(0, matchIndex).split('\n').length;
    const importedSymbols = [];

    const namedMatch = rawClause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach((s) => {
        const cleanSymbol = s.replace(/\btype\s+/, '').trim();
        const sym = cleanSymbol.split(/\s+as\s+/)[0].trim();
        if (sym) importedSymbols.push(sym);
      });
    }

    const defaultMatch = rawClause
      .replace(/\{[^}]+\}/, '')
      .replace(/,/g, '')
      .trim();
    if (defaultMatch && !defaultMatch.startsWith('*')) {
      importedSymbols.unshift(defaultMatch);
    }

    deps.push({
      sourceFile: relPath,
      moduleSpecifier: specifier,
      line,
      column: 1,
      isTypeOnly,
      isDynamic: false,
      isDynamicLiteral: false,
      isExport: false,
      importedSymbols,
    });
  }

  // 3. Side-effect imports: import '...'
  const sideEffectRegex = /(?:^|[;\n])\s*import\s+['"]([^'"]+)['"]/g;
  while ((match = sideEffectRegex.exec(cleanCode)) !== null) {
    const specifier = match[1];
    const matchIndex = match.index;
    const line = cleanCode.slice(0, matchIndex).split('\n').length;

    // Evita duplicar se já foi capturado por import ... from
    if (!deps.some((d) => d.line === line && d.moduleSpecifier === specifier)) {
      deps.push({
        sourceFile: relPath,
        moduleSpecifier: specifier,
        line,
        column: 1,
        isTypeOnly: false,
        isDynamic: false,
        isDynamicLiteral: false,
        isExport: false,
        importedSymbols: [],
      });
    }
  }

  // 4. Reexport declarations: export ... from '...'
  const exportRegex = /(?:^|[;\n])\s*export\s+(?:type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = exportRegex.exec(cleanCode)) !== null) {
    const fullMatch = match[0];
    const rawClause = match[1];
    const specifier = match[2];
    const isTypeOnly = /^\s*(?:[;\n]\s*)?export\s+type\b/.test(fullMatch);
    const line = cleanCode.slice(0, match.index).split('\n').length;
    const importedSymbols = [];

    const namedMatch = rawClause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach((s) => {
        const cleanSymbol = s.replace(/\btype\s+/, '').trim();
        const sym = cleanSymbol.split(/\s+as\s+/)[0].trim();
        if (sym) importedSymbols.push(sym);
      });
    }

    deps.push({
      sourceFile: relPath,
      moduleSpecifier: specifier,
      line,
      column: 1,
      isTypeOnly,
      isDynamic: false,
      isDynamicLiteral: false,
      isExport: true,
      importedSymbols,
    });
  }

  // 5. Dynamic imports literais: import('...')
  const dynamicLiteralRegex = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicLiteralRegex.exec(cleanCode)) !== null) {
    const specifier = match[1];
    const line = cleanCode.slice(0, match.index).split('\n').length;
    deps.push({
      sourceFile: relPath,
      moduleSpecifier: specifier,
      line,
      column: 1,
      isTypeOnly: false,
      isDynamic: true,
      isDynamicLiteral: true,
      isExport: false,
      importedSymbols: [],
    });
  }

  // 6. Dynamic imports não literais: import(expressao)
  const dynamicNonLiteralRegex = /\bimport\s*\(\s*([^'")\s][^)]*)\)/g;
  while ((match = dynamicNonLiteralRegex.exec(cleanCode)) !== null) {
    const expr = match[1].trim();
    const line = cleanCode.slice(0, match.index).split('\n').length;
    diagnostics.push({
      type: 'NON_LITERAL_DYNAMIC_IMPORT',
      message: `Import dinâmico com argumento não literal detectado: import(${expr}). Dependência estática não determinável.`,
      line,
      column: 1,
      sourceFile: relPath,
    });
  }

  // Ordena dependências deterministicamente por linha
  deps.sort((a, b) => a.line - b.line);

  return { dependencies: deps, diagnostics };
}

/**
 * Extrai dependências sintáticas e diagnósticos de um arquivo inspecionando
 * diretamente a AST oficial gerada pela TypeScript Compiler API.
 *
 * @param {string} fullPath - Caminho absoluto do arquivo.
 * @param {string} relPath - Caminho relativo normalizado do arquivo.
 * @param {any} api - Instância inicializada da TypeScript Compiler API (sync).
 * @returns {{ dependencies: ModuleDependency[], diagnostics: SourceDiagnostic[] }}
 */
function extractWithTypeScriptAst(fullPath, relPath, api) {
  const deps = [];
  const diagnostics = [];

  const snapshot = api.updateSnapshot({ openFiles: [fullPath] });
  const project = snapshot.getDefaultProjectForFile(fullPath);

  if (!project || !project.program) {
    throw new Error(`TypeScript API não conseguiu resolver projeto para: "${fullPath}"`);
  }

  const sourceFile = project.program.getSourceFile(fullPath);
  if (!sourceFile) {
    throw new Error(`TypeScript API não conseguiu extrair SourceFile para: "${fullPath}"`);
  }

  const importsList = sourceFile.imports || [];

  for (const imp of importsList) {
    const parentNode = imp.parent;
    if (!parentNode) continue;

    const moduleSpecifier = imp.text;
    if (typeof moduleSpecifier !== 'string') continue;

    // Calcula linha e coluna da declaração pai
    const startPos = parentNode.getStart ? parentNode.getStart(sourceFile) : parentNode.pos;
    const lc = sourceFile.getLineAndCharacterOfPosition(startPos);
    const line = lc.line + 1;
    const column = lc.character + 1;

    // 273: ImportDeclaration, 279: ExportDeclaration, 214: CallExpression
    const kind = parentNode.kind;
    const isDynamic = kind === 214;
    const isExport = kind === 279;
    let isTypeOnly = false;
    const importedSymbols = [];

    if (kind === 273) {
      // ImportDeclaration
      const clause = parentNode.importClause;
      if (clause) {
        isTypeOnly = Boolean(clause.isTypeOnly || parentNode.isTypeOnly);

        if (clause.name && clause.name.text) {
          importedSymbols.push(clause.name.text);
        }

        if (clause.namedBindings) {
          if (clause.namedBindings.elements && Array.isArray(clause.namedBindings.elements)) {
            for (const el of clause.namedBindings.elements) {
              if (el.name && el.name.text) {
                importedSymbols.push(el.name.text);
              }
            }
          } else if (clause.namedBindings.name && clause.namedBindings.name.text) {
            importedSymbols.push(clause.namedBindings.name.text);
          }
        }
      }
    } else if (kind === 279) {
      // ExportDeclaration
      isTypeOnly = Boolean(parentNode.isTypeOnly);
      const clause = parentNode.exportClause;
      if (clause) {
        if (clause.elements && Array.isArray(clause.elements)) {
          for (const el of clause.elements) {
            if (el.name && el.name.text) {
              importedSymbols.push(el.name.text);
            }
          }
        } else if (clause.name && clause.name.text) {
          importedSymbols.push(clause.name.text);
        }
      }
    }

    deps.push({
      sourceFile: relPath,
      moduleSpecifier,
      line,
      column,
      isTypeOnly,
      isDynamic,
      isDynamicLiteral: isDynamic,
      isExport,
      importedSymbols,
    });
  }

  // Identificação de imports dinâmicos não literais percorrendo os nós do SourceFile
  if (sourceFile.nodes && Array.isArray(sourceFile.nodes)) {
    for (let i = 1; i < sourceFile.nodes.length; i++) {
      const node = sourceFile.getOrCreateNodeAtIndex(i);
      if (node && node.kind === 214) {
        // CallExpression
        if (node.expression && node.expression.kind === 101) {
          // 101: ImportKeyword
          const args = node.arguments || [];
          if (args.length > 0) {
            const firstArg = args[0];
            // 10: StringLiteral, 14: NoSubstitutionTemplateLiteral
            const isLiteral = firstArg.kind === 10 || firstArg.kind === 14;
            if (!isLiteral) {
              const argPos = node.getStart ? node.getStart(sourceFile) : node.pos;
              const argLc = sourceFile.getLineAndCharacterOfPosition(argPos);
              diagnostics.push({
                type: 'NON_LITERAL_DYNAMIC_IMPORT',
                message:
                  'Import dinâmico com argumento não literal detectado. Dependência estática não determinável.',
                line: argLc.line + 1,
                column: argLc.character + 1,
                sourceFile: relPath,
              });
            }
          }
        }
      }
    }
  }

  return { dependencies: deps, diagnostics };
}

/**
 * Extrai todas as dependências de importação e reexportação de um arquivo TypeScript ou JavaScript.
 *
 * Utiliza preferencialmente a TypeScript Compiler API oficial para análise sintática
 * estruturada por AST. Em caso de indisponibilidade ou falha do processo da API,
 * aciona automaticamente o analisador léxico de fallback tolerante a falhas.
 *
 * Preserva 100% de compatibilidade retroativa com os consumidores existentes.
 *
 * @param {string} filePath - Caminho do arquivo a ser analisado.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto para normalização de caminhos.
 * @param {Object} [options={}] - Opções adicionais de análise.
 * @returns {ModuleDependency[]} Lista estruturada das dependências encontradas no arquivo.
 * @throws {Error} Se o arquivo não existir ou não puder ser lido.
 */
export function extractDependenciesFromSource(filePath, projectRoot = process.cwd(), options = {}) {
  const analysis = analyzeSourceFile(filePath, projectRoot, options);
  return analysis.dependencies;
}

/**
 * Análise aprofundada de um arquivo de código-fonte, retornando dependências estruturadas
 * e diagnósticos sintáticos rastreáveis.
 *
 * @param {string} filePath - Caminho do arquivo a ser analisado.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto.
 * @param {Object} [options={}] - Opções de configuração da análise.
 * @returns {{ dependencies: ModuleDependency[], diagnostics: SourceDiagnostic[], sourceFile: string }}
 */
export function analyzeSourceFile(filePath, projectRoot = process.cwd(), _options = {}) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`analyzeSourceFile: Arquivo inexistente: "${fullPath}"`);
  }

  const relPath = normalizePath(path.relative(projectRoot, fullPath));

  // Tenta utilizar a TypeScript Compiler API caso a sincronização seja possível
  if (!sharedTsApiFailed && sharedTsApiInstance) {
    try {
      return {
        sourceFile: relPath,
        ...extractWithTypeScriptAst(fullPath, relPath, sharedTsApiInstance),
      };
    } catch {
      // Se a chamada ao compilador falhar para este arquivo específico, recorre ao fallback
    }
  }

  // Fallback estruturado baseado no conteúdo do arquivo
  const content = fs.readFileSync(fullPath, 'utf8');
  const result = extractWithLexicalFallback(content, relPath);

  return {
    sourceFile: relPath,
    ...result,
  };
}
