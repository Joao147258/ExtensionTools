/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/lib/fs-utils.mjs
 * Responsabilidade: Utilitários compartilhados para manipulação segura e
 *                  resiliente do sistema de arquivos local.
 *
 * Propósito:
 * Centralizar operações fundamentais de leitura, travessia recursiva de diretórios,
 * normalização multiplataforma de caminhos e prevenção contra vulnerabilidades
 * clássicas de travessia (Directory / Path Traversal) e ataques de links simbólicos
 * (Symlink Following Attack).
 *
 * Problema Resolvido:
 * Elimina duplicações de busca recursiva de arquivos nos scanners de segurança,
 * linter de arquitetura e verificadores de documentação, garantindo comportamento
 * consistente e seguro entre ambientes POSIX (Linux/macOS) e Windows.
 *
 * Considerações de Segurança:
 * 1. Prevenção de Path Traversal: Garante que caminhos resolvidos nunca escapem
 *    da raiz autorizada do projeto (`projectRoot`).
 * 2. Controle de Symlinks: Links simbólicos que apontem para fora da raiz autorizada
 *    ou que formem ciclos de recursão infinita são detectados e ignorados ou rejeitados.
 * 3. Fail-Safe: Erros de leitura em arquivos monitorados são propagados ao consumidor,
 *    impedindo que falhas de I/O sejam mascaradas como conformidade de segurança.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Normaliza um caminho de arquivo para o padrão universal com barras normais ('/').
 *
 * Por que esta normalização é crucial:
 * No sistema operacional Windows, os caminhos utilizam contrabarras ('\\'). Se regexes
 * ou verificadores de integridade manipularem contrabarras, ocorrem falhas de escape
 * e inconsistências em diagnósticos e relatórios multiplataforma.
 *
 * @param {string} rawPath - Caminho de arquivo original (relativo ou absoluto).
 * @returns {string} Caminho com todas as contrabarras convertidas para barras normais.
 */
export function normalizePath(rawPath) {
  if (typeof rawPath !== 'string') {
    throw new TypeError(
      `normalizePath: O argumento deve ser uma string, recebido: ${typeof rawPath}`
    );
  }
  return rawPath.replace(/\\/g, '/');
}

/**
 * Resolve um caminho de forma segura garantindo que ele permaneça estritamente
 * contido dentro da raiz autorizada do projeto (prevenção contra Path Traversal).
 *
 * Princípio de Engenharia:
 * Ao receber caminhos de fontes externas ou entradas dinâmicas (como argumentos CLI
 * ou links relativos em arquivos Markdown), existe o risco de uso deliberado de
 * sequências de escape como '../' para ler arquivos confidenciais do sistema operacional
 * (ex: /etc/passwd ou C:\\Windows).
 *
 * @param {string} targetPath - Caminho alvo (relativo ou absoluto).
 * @param {string} [projectRoot=process.cwd()] - Raiz autorizada do projeto.
 * @returns {string} Caminho absoluto canônico resolvido.
 * @throws {Error} Se o caminho resolvido escapar dos limites da raiz autorizada.
 */
export function resolveSafePath(targetPath, projectRoot = process.cwd()) {
  const absoluteRoot = path.resolve(projectRoot);
  const absoluteTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(absoluteRoot, targetPath);

  // Normaliza ambos para comparação de prefixo confiável
  const normRoot = normalizePath(absoluteRoot);
  const normTarget = normalizePath(absoluteTarget);

  const isInside =
    normTarget === normRoot ||
    normTarget.startsWith(normRoot.endsWith('/') ? normRoot : `${normRoot}/`);

  if (!isInside) {
    throw new Error(
      `Violação de segurança (Path Traversal detectado): O caminho "${targetPath}" tenta acessar local fora da raiz autorizada "${projectRoot}".`
    );
  }

  return absoluteTarget;
}

/**
 * Opções para a função recursiva de listagem de arquivos.
 * @typedef {Object} WalkDirOptions
 * @property {string[]} [ignoredDirs=['node_modules', '.git', '.output', '.wxt', 'dist', 'build']] - Diretórios a ignorar na busca.
 * @property {RegExp[]} [includePatterns=[]] - Padrões regex para inclusão de arquivos (se vazio, inclui todos).
 * @property {RegExp[]} [excludePatterns=[]] - Padrões regex para exclusão de arquivos.
 * @property {number} [maxDepth=20] - Limite de profundidade de diretórios para prevenir estouro de pilha.
 * @property {number} [maxFileSize=10485760] - Limite máximo de tamanho do arquivo em bytes (padrão: 10MB).
 * @property {boolean} [followSymlinks=false] - Se deve seguir links simbólicos internos à raiz.
 */

/**
 * Percorre recursivamente um diretório coletando caminhos de arquivos de forma
 * segura, determinística e resiliente.
 *
 * Estratégia de Implementação:
 * 1. Travessia síncrona com controle rigoroso de profundidade (`maxDepth`).
 * 2. Rastreamento de nós visitados (`visitedInodes`) para bloquear ciclos de symlinks.
 * 3. Validação de fronteira para que symlinks não apontem para fora do projeto.
 * 4. Retorno de caminhos relativos à raiz informada, normalizados com barras normais.
 *
 * @param {string} dirPath - Diretório a ser percorrido.
 * @param {WalkDirOptions} [options={}] - Opções de configuração da busca.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto para cálculo dos caminhos relativos.
 * @param {number} [currentDepth=0] - Controle interno de profundidade atual.
 * @param {Set<string>} [visitedRealPaths=new Set()] - Controle interno contra ciclos de symlinks.
 * @returns {string[]} Lista de caminhos relativos normalizados dos arquivos encontrados.
 * @throws {Error} Se o diretório base não existir ou for inacessível.
 */
export function walkDirectory(
  dirPath,
  options = {},
  projectRoot = process.cwd(),
  currentDepth = 0,
  visitedRealPaths = new Set()
) {
  const {
    ignoredDirs = ['node_modules', '.git', '.output', '.wxt', 'dist', 'build'],
    includePatterns = [],
    excludePatterns = [],
    maxDepth = 20,
    maxFileSize = 10 * 1024 * 1024,
    followSymlinks = false,
  } = options;

  if (currentDepth > maxDepth) {
    return [];
  }

  const safeRoot = resolveSafePath(dirPath, projectRoot);

  if (!fs.existsSync(safeRoot)) {
    throw new Error(`walkDirectory: O diretório informado não existe: "${safeRoot}"`);
  }

  let realCurrentPath;
  try {
    realCurrentPath = fs.realpathSync(safeRoot);
  } catch (err) {
    throw new Error(
      `walkDirectory: Falha ao resolver caminho real de "${safeRoot}": ${err.message}`,
      { cause: err }
    );
  }

  if (visitedRealPaths.has(realCurrentPath)) {
    // Ciclo de symlink detectado; aborta este ramo com segurança
    return [];
  }
  visitedRealPaths.add(realCurrentPath);

  let entries;
  try {
    entries = fs.readdirSync(safeRoot, { withFileTypes: true });
  } catch (err) {
    throw new Error(
      `walkDirectory: Falha ao ler conteúdo do diretório "${safeRoot}": ${err.message}`,
      { cause: err }
    );
  }

  const collectedFiles = [];

  for (const entry of entries) {
    const fullEntryPath = path.join(safeRoot, entry.name);
    const relEntryPath = normalizePath(path.relative(projectRoot, fullEntryPath));
    const basename = entry.name;

    // 1. Verificação de exclusão de diretórios ignorados
    if (entry.isDirectory() && ignoredDirs.includes(basename)) {
      continue;
    }

    // 2. Tratamento de links simbólicos
    if (entry.isSymbolicLink()) {
      if (!followSymlinks) {
        continue;
      }
      try {
        const realLinkTarget = fs.realpathSync(fullEntryPath);
        // Garante que o alvo do symlink resida dentro da raiz autorizada do projeto
        resolveSafePath(realLinkTarget, projectRoot);
        const stat = fs.statSync(realLinkTarget);
        if (stat.isDirectory()) {
          const subFiles = walkDirectory(
            fullEntryPath,
            options,
            projectRoot,
            currentDepth + 1,
            visitedRealPaths
          );
          collectedFiles.push(...subFiles);
        } else if (stat.isFile()) {
          if (
            stat.size <= maxFileSize &&
            isFileMatching(relEntryPath, basename, includePatterns, excludePatterns)
          ) {
            collectedFiles.push(relEntryPath);
          }
        }
      } catch {
        // Symlinks quebrados ou que apontem para fora da raiz autorizada são ignorados de forma segura
        continue;
      }
      continue;
    }

    // 3. Subdiretório comum
    if (entry.isDirectory()) {
      const subFiles = walkDirectory(
        fullEntryPath,
        options,
        projectRoot,
        currentDepth + 1,
        visitedRealPaths
      );
      collectedFiles.push(...subFiles);
      continue;
    }

    // 4. Arquivo comum
    if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullEntryPath);
        if (stat.size > maxFileSize) {
          // Arquivos gigantes excedendo o limite são ignorados para não esgotar a memória do scanner
          continue;
        }
      } catch {
        continue;
      }

      if (isFileMatching(relEntryPath, basename, includePatterns, excludePatterns)) {
        collectedFiles.push(relEntryPath);
      }
    }
  }

  return collectedFiles;
}

/**
 * Avalia se um arquivo atende aos critérios de inclusão e exclusão informados.
 *
 * @param {string} relPath - Caminho relativo normalizado do arquivo.
 * @param {string} basename - Nome base do arquivo.
 * @param {RegExp[]} includePatterns - Padrões regex para inclusão obrigatória (se vazio, inclui).
 * @param {RegExp[]} excludePatterns - Padrões regex para exclusão.
 * @returns {boolean} True se o arquivo deve ser incluído na listagem.
 */
function isFileMatching(relPath, basename, includePatterns, excludePatterns) {
  // Verifica se casa com exclusões
  for (const exp of excludePatterns) {
    if (exp.test(relPath) || exp.test(basename)) {
      return false;
    }
  }

  // Se não há filtros de inclusão, aceita por padrão
  if (includePatterns.length === 0) {
    return true;
  }

  // Deve casar com pelo menos um padrão de inclusão
  return includePatterns.some((inc) => inc.test(relPath) || inc.test(basename));
}

/**
 * Lê o conteúdo textual de um arquivo de forma controlada e segura.
 *
 * @param {string} filePath - Caminho do arquivo a ler.
 * @param {string} [projectRoot=process.cwd()] - Raiz autorizada do projeto.
 * @param {number} [maxSizeBytes=10485760] - Tamanho máximo tolerado (padrão: 10MB).
 * @returns {string} Conteúdo em string UTF-8 do arquivo.
 * @throws {Error} Se o arquivo não existir, exceder o tamanho máximo ou falhar na leitura.
 */
export function readTextFileSafe(
  filePath,
  projectRoot = process.cwd(),
  maxSizeBytes = 10 * 1024 * 1024
) {
  const safePath = resolveSafePath(filePath, projectRoot);

  if (!fs.existsSync(safePath)) {
    throw new Error(`readTextFileSafe: Arquivo inexistente: "${safePath}"`);
  }

  const stat = fs.statSync(safePath);
  if (stat.isDirectory()) {
    throw new Error(
      `readTextFileSafe: O caminho apontado é um diretório, não um arquivo: "${safePath}"`
    );
  }

  if (stat.size > maxSizeBytes) {
    throw new Error(
      `readTextFileSafe: O arquivo "${filePath}" possui ${stat.size} bytes e excede o limite tolerado de ${maxSizeBytes} bytes.`
    );
  }

  try {
    return fs.readFileSync(safePath, 'utf8');
  } catch (err) {
    throw new Error(`readTextFileSafe: Falha ao ler arquivo "${safePath}": ${err.message}`, {
      cause: err,
    });
  }
}
