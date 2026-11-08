/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/lib/git-utils.mjs
 * Responsabilidade: Encapsular com segurança todas as operações de consulta e
 *                  inspeção técnica ao Git CLI para os scripts do harness.
 *
 * Propósito:
 * Centralizar o tratamento resiliente de comandos do Git, eliminando falhas
 * silenciosas em repositórios novos sem commits, branches desprovidas de upstream,
 * e garantindo a extração autêntica de blobs registrados no index e em commits.
 *
 * Problema Resolvido:
 * Evita chamadas dispersas a `execSync` com interpolação frágil de strings de shell,
 * fornece delimitação por byte nulo (`-z`) para imunidade a arquivos com espaços e
 * caracteres Unicode, e provê fallbacks seguros contra repositórios recém-iniciados.
 *
 * Considerações de Segurança:
 * 1. Somente-Leitura: Esta biblioteca implementa estritamente operações de consulta
 *    e extração de blobs (`diff`, `rev-parse`, `rev-list`, `show`, `ls-files`).
 *    Comandos mutáveis (`commit`, `push`, `reset`) são terminantemente proibidos aqui.
 * 2. Segurança de Argumentos: Utiliza `execFileSync` com arrays explícitos de argumentos
 *    para mitigar riscos de injeção de comandos em shells.
 * 3. Fail-Safe: Falhas de subprocessos do Git são tratadas e convertidas em erros
 *    estruturados, impedindo que falhas operacionais sejam confundidas com listas vazias.
 * ==============================================================================
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Executa um comando Git síncrono com argumentos separados e tratamento rigoroso de erros.
 *
 * @param {string[]} args - Argumentos passados diretamente ao binário do Git.
 * @param {string} [projectRoot=process.cwd()] - Diretório de execução do comando.
 * @param {Object} [options={}] - Opções adicionais para `execFileSync`.
 * @returns {string} Saída textual (stdout) do comando executado.
 * @throws {Error} Se o comando falhar, não encontrar o repositório ou retornar código diferente de zero.
 */
export function execGit(args, projectRoot = process.cwd(), options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 20 * 1024 * 1024, // 20MB de buffer para diffs e listas volumosas
      ...options,
    });
  } catch (err) {
    const stderrMsg = err.stderr ? err.stderr.toString().trim() : '';
    throw new Error(
      `Falha operacional do Git (git ${args.join(' ')}): ${stderrMsg || err.message}`,
      {
        cause: err,
      }
    );
  }
}

/**
 * Verifica se um diretório é a raiz ou faz parte de um repositório Git válido.
 *
 * @param {string} [projectRoot=process.cwd()] - Diretório a inspecionar.
 * @returns {boolean} True se o diretório estiver dentro de um repositório Git.
 */
export function isGitRepository(projectRoot = process.cwd()) {
  try {
    const out = execGit(['rev-parse', '--is-inside-work-tree'], projectRoot);
    return out.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Verifica se o repositório Git possui pelo menos um commit válido gravado.
 *
 * Por que esta checagem é fundamental:
 * Em repositórios recém-criados com `git init`, o ponteiro `HEAD` ainda não referencia
 * nenhum objeto commit. Comandos como `git rev-parse HEAD` ou `git rev-list HEAD`
 * lançam erro fatal de argumento ambíguo se invocados nesse estado.
 *
 * @param {string} [projectRoot=process.cwd()] - Diretório do repositório.
 * @returns {boolean} True se existir pelo menos um commit em HEAD.
 */
export function hasCommits(projectRoot = process.cwd()) {
  try {
    execGit(['rev-parse', '--verify', 'HEAD'], projectRoot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém a lista de arquivos preparados para commit no Git index (staged).
 *
 * Detalhes Técnicos:
 * - Utiliza a flag `-z` para delimitação por byte nulo (`\0`), blindando contra espaços.
 * - Utiliza `--diff-filter=ACMRT` para capturar arquivos Adicionados, Copiados, Modificados,
 *   Renomeados e que sofreram alteração de Tipo (`T`, como conversão para symlink).
 * - Opera perfeitamente mesmo em repositórios sem nenhum commit anterior.
 *
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {string[]} Lista de caminhos relativos dos arquivos no stage.
 */
export function getStagedFiles(projectRoot = process.cwd()) {
  try {
    const stdout = execGit(
      ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRT'],
      projectRoot
    );
    return stdout
      .split('\0')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch (err) {
    throw new Error(`getStagedFiles: Impossível consultar arquivos no index Git: ${err.message}`, {
      cause: err,
    });
  }
}

/**
 * Metadados de um arquivo associado a um commit outgoing pendente de push.
 * @typedef {Object} OutgoingCommitObject
 * @property {string} commit - Hash completo do commit.
 * @property {string} file - Caminho relativo do arquivo modificado naquele commit.
 */

/**
 * Identifica todos os objetos e arquivos modificados nos commits pendentes de envio (outgoing).
 *
 * Regras de Negócio e Governança:
 * 1. Se existir branch upstream configurada (`@{u}`), compara `@{u}..HEAD`.
 * 2. Se não existir upstream configurada, avalia todos os commits locais alcançáveis a partir de HEAD.
 * 3. Se o repositório não possuir nenhum commit ainda, retorna uma lista vazia de forma segura.
 * 4. Utiliza `git diff-tree --root -r -z --diff-filter=ACMRT` para auditar inclusive o primeiro commit da árvore.
 *
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {OutgoingCommitObject[]} Lista de pares { commit, file } correspondentes aos commits outgoing.
 */
export function getOutgoingCommitObjects(projectRoot = process.cwd()) {
  if (!hasCommits(projectRoot)) {
    return [];
  }

  let revRange;

  try {
    execGit(['rev-parse', '--abbrev-ref', '@{u}'], projectRoot);
    revRange = '@{u}..HEAD';
  } catch {
    revRange = 'HEAD';
  }

  let commitsStdout;
  try {
    commitsStdout = execGit(['rev-list', revRange], projectRoot);
  } catch (err) {
    throw new Error(
      `getOutgoingCommitObjects: Falha ao listar commits do intervalo "${revRange}": ${err.message}`,
      {
        cause: err,
      }
    );
  }

  const commits = commitsStdout
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const objects = [];

  for (const commitHash of commits) {
    let diffTreeStdout;
    try {
      diffTreeStdout = execGit(
        [
          'diff-tree',
          '--root',
          '--no-commit-id',
          '--name-only',
          '-r',
          '-z',
          '--diff-filter=ACMRT',
          commitHash,
        ],
        projectRoot
      );
    } catch (err) {
      throw new Error(
        `getOutgoingCommitObjects: Falha ao extrair árvore do commit ${commitHash.slice(0, 8)}: ${err.message}`,
        { cause: err }
      );
    }

    const files = diffTreeStdout
      .split('\0')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const file of files) {
      objects.push({ commit: commitHash, file });
    }
  }

  return objects;
}

/**
 * Obtém a lista consolidada (única) de nomes de arquivos alterados nos commits outgoing.
 *
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {string[]} Lista de caminhos relativos únicos dos arquivos outgoing.
 */
export function getOutgoingFiles(projectRoot = process.cwd()) {
  const commitObjs = getOutgoingCommitObjects(projectRoot);
  return Array.from(new Set(commitObjs.map((o) => o.file)));
}

/**
 * Obtém a lista de todos os arquivos monitorados e versionados no repositório (git ls-files).
 *
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {string[]} Lista de arquivos rastreados.
 */
export function getTrackedFiles(projectRoot = process.cwd()) {
  try {
    const stdout = execGit(['ls-files', '-z'], projectRoot);
    return stdout
      .split('\0')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch (err) {
    throw new Error(
      `getTrackedFiles: Falha ao enumerar arquivos monitorados pelo Git: ${err.message}`,
      {
        cause: err,
      }
    );
  }
}

/**
 * Extrai o conteúdo textual de um blob diretamente do Git index ou de um commit específico.
 *
 * Por que não ler do disco:
 * No Git, um arquivo pode ser adicionado ao index com um segredo e, em seguida, o desenvolvedor
 * pode alterar o arquivo na working tree para texto limpo. Ler do disco nesse momento mascara
 * o segredo que efetivamente será gravado no commit. A leitura via blob garante inspeção fiel.
 *
 * @param {string} filePath - Caminho relativo do arquivo no repositório.
 * @param {string} [revision=''] - Hash do commit, tag ou vazio para ler do index (stage 0).
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {string} Conteúdo em string UTF-8 do blob extraído.
 * @throws {Error} Se o blob não for encontrado no objeto Git especificado.
 */
export function getGitBlobContent(filePath, revision = '', projectRoot = process.cwd()) {
  const spec = revision ? `${revision}:${filePath}` : `:${filePath}`;
  try {
    return execGit(['show', spec], projectRoot);
  } catch (err) {
    throw new Error(`getGitBlobContent: Falha ao extrair blob "${spec}": ${err.message}`, {
      cause: err,
    });
  }
}

/**
 * Cria uma estrutura de diretórios temporários contendo os blobs autênticos dos arquivos
 * staged no Git index, permitindo que scanners realizem auditorias completas sem tocar
 * a working tree potencialmente defasada.
 *
 * @param {string[]} files - Lista de arquivos staged.
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório original.
 * @returns {{ targetRoot: string, cleanup: () => void }} Objeto com a pasta do snapshot e função de descarte.
 */
export function createStagedSnapshot(files, projectRoot = process.cwd()) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-snapshot-staged-'));

  for (const relFile of files) {
    try {
      const content = getGitBlobContent(relFile, '', projectRoot);
      const destPath = path.join(tmpDir, relFile);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, content, 'utf8');
    } catch {
      // Se não for possível ler via blob (ex: arquivo deletado ou binário), copia do disco se existir
      const srcPath = path.join(projectRoot, relFile);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(tmpDir, relFile);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch {
          // Ignora falha de cópia
        }
      }
    }
  }

  // Copia configurações de segurança para que os scanners encontrem suas regras na pasta temporária
  copyConfigsToSnapshot(projectRoot, tmpDir);

  return {
    targetRoot: tmpDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignora erro no cleanup
      }
    },
  };
}

/**
 * Cria snapshots temporários isolados para cada commit outgoing pendente de push,
 * permitindo auditar o conteúdo de commits históricos mesmo que tenham sido removidos depois.
 *
 * @param {OutgoingCommitObject[]} commitObjects - Lista de pares { commit, file }.
 * @param {string} [projectRoot=process.cwd()] - Raiz do repositório.
 * @returns {Array<{ commit: string, targetRoot: string, files: string[], cleanup: () => void }>}
 */
export function createOutgoingSnapshots(commitObjects, projectRoot = process.cwd()) {
  const byCommit = new Map();
  for (const obj of commitObjects) {
    if (!byCommit.has(obj.commit)) {
      byCommit.set(obj.commit, []);
    }
    byCommit.get(obj.commit).push(obj.file);
  }

  const snapshots = [];

  for (const [commitHash, files] of byCommit.entries()) {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), `git-snapshot-out-${commitHash.slice(0, 8)}-`)
    );

    for (const relFile of files) {
      try {
        const content = getGitBlobContent(relFile, commitHash, projectRoot);
        const destPath = path.join(tmpDir, relFile);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, content, 'utf8');
      } catch {
        // Blob deletado no commit pode falhar sem prejuízo à auditoria
      }
    }

    copyConfigsToSnapshot(projectRoot, tmpDir);

    snapshots.push({
      commit: commitHash,
      targetRoot: tmpDir,
      files,
      cleanup: () => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
          // Ignora erro no cleanup
        }
      },
    });
  }

  return snapshots;
}

/**
 * Copia as pastas de configuração do harness para o snapshot temporário.
 *
 * @param {string} projectRoot
 * @param {string} targetDir
 */
function copyConfigsToSnapshot(projectRoot, targetDir) {
  const configSrc = path.join(projectRoot, '.harness/config');
  if (fs.existsSync(configSrc)) {
    const configDest = path.join(targetDir, '.harness/config');
    fs.mkdirSync(configDest, { recursive: true });
    for (const f of fs.readdirSync(configSrc)) {
      try {
        fs.copyFileSync(path.join(configSrc, f), path.join(configDest, f));
      } catch {
        // Ignora
      }
    }
  }

  const privateConfigSrc = path.join(projectRoot, '.local/repository-safety.private.json');
  if (fs.existsSync(privateConfigSrc)) {
    const privateDestDir = path.join(targetDir, '.local');
    fs.mkdirSync(privateDestDir, { recursive: true });
    try {
      fs.copyFileSync(
        privateConfigSrc,
        path.join(privateDestDir, 'repository-safety.private.json')
      );
    } catch {
      // Ignora
    }
  }
}
