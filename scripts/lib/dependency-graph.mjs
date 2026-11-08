/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/lib/dependency-graph.mjs
 * Responsabilidade: Estrutura de dados de Grafo Direcionado de Dependências (DAG/DG)
 *                  com detecção determinística de ciclos diretos e transitivos.
 *
 * Propósito:
 * Sustentar o Quality Gate `QG-02 — Architecture Boundaries` e a regra arquitetural
 * `ARC-R07 (Prevenção de Dependências Circulares)` definida em ARCHITECTURE.md.
 *
 * Princípios de Engenharia e Inovações (M2-PHASE-4 | Bloco 5):
 * 1. Grafo Direcionado Determinístico: Representação formal de nós (módulos) e
 *    arestas orientadas (dependências de importação e reexportação).
 * 2. Detecção Linear de Ciclos via DFS: Algoritmo de busca em profundidade com
 *    coloração de 3 estados (Branco = não visitado, Cinza = em processamento na pilha,
 *    Preto = concluído), com complexidade temporal estritamente O(V + E) e espaço O(V).
 * 3. Identificação e Classificação de Ciclos:
 *    - Ciclos Diretos: 2 módulos com dependência mútua (A -> B -> A).
 *    - Ciclos Transitivos: 3 ou mais módulos formando um laço fechado (A -> B -> C -> A).
 * 4. Normalização Canônica de Ciclos: Elimina duplicatas de ciclos equivalentes rotacionados
 *    (ex: [A, B, C, A] e [B, C, A, B] são unificados na rota iniciada pelo menor nó lexicográfico).
 * 5. Tratamento de Dependências Duplicadas: Arestas múltiplas entre o mesmo par (A -> B)
 *    são unificadas, preservando os metadados de cada importação (linhas, tipos).
 * 6. Suporte a Módulos Isolados: Rastreamento determinístico de nós órfãos ou ilhas sem dependências.
 * 7. Filtro Parametrizável de Tipos (isTypeOnly): Possibilidade de incluir ou ignorar dependências
 *    exclusivamente de tipo (`import type`), distinguindo o acoplamento estático do acoplamento em runtime.
 * ==============================================================================
 */

import path from 'node:path';
import { normalizePath } from './fs-utils.mjs';
import { extractDependenciesFromSource, resolveModule } from './ast-analyzer.mjs';

/**
 * Metadados de uma aresta direcionada entre dois módulos.
 * @typedef {Object} GraphEdge
 * @property {string} from - Identificador normalizado do nó de origem.
 * @property {string} to - Identificador normalizado do nó de destino.
 * @property {boolean} isTypeOnly - True se a dependência for exclusivamente de tipo.
 * @property {boolean} isDynamic - True se for import dinâmico.
 * @property {boolean} isExport - True se for reexportação.
 * @property {string} moduleSpecifier - Especificador original do import no código.
 * @property {number} line - Linha da declaração no arquivo de origem.
 * @property {number} column - Coluna da declaração no arquivo de origem.
 */

/**
 * Informações estruturadas de um nó do grafo.
 * @typedef {Object} GraphNode
 * @property {string} id - Caminho relativo normalizado do módulo.
 * @property {boolean} isExternal - True se for dependência externa (npm/node).
 * @property {boolean} isIsolated - True se não possuir dependências de entrada nem de saída.
 * @property {Record<string, any>} metadata - Metadados adicionais associados ao nó.
 */

/**
 * Estrutura descritiva de um ciclo detectado no grafo.
 * @typedef {Object} DetectedCycle
 * @property {'direct' | 'transitive'} type - Tipo do ciclo ('direct' para tamanho 2, 'transitive' para >= 3).
 * @property {string[]} cycle - Sequência ordenada de nós formando o laço fechado (ex: ['a.ts', 'b.ts', 'a.ts']).
 * @property {number} length - Quantidade de arestas distintas no ciclo.
 * @property {string} pathString - Representação textual legível do ciclo (ex: 'a.ts -> b.ts -> a.ts').
 * @property {GraphEdge[]} edges - Arestas correspondentes que compõem o ciclo.
 */

/**
 * Classe principal de Grafo Direcionado de Dependências.
 */
export class DependencyGraph {
  constructor() {
    /** @type {Map<string, GraphNode>} */
    this.nodes = new Map();

    /** @type {Map<string, Map<string, GraphEdge[]>>} from -> (to -> edges[]) */
    this.adjacency = new Map();

    /** @type {Map<string, Map<string, GraphEdge[]>>} to -> (from -> edges[]) */
    this.reverseAdjacency = new Map();
  }

  /**
   * Registra um novo nó no grafo.
   *
   * @param {string} nodeId - Identificador normalizado do módulo (caminho relativo).
   * @param {Object} [metadata={}] - Metadados adicionais do nó.
   * @param {boolean} [isExternal=false] - Se o módulo é um pacote externo.
   * @returns {GraphNode} O nó registrado ou existente.
   */
  addNode(nodeId, metadata = {}, isExternal = false) {
    if (typeof nodeId !== 'string' || !nodeId.trim()) {
      throw new TypeError('addNode: nodeId deve ser uma string não vazia');
    }

    const id = nodeId.trim();
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        isExternal,
        isIsolated: true,
        metadata: { ...metadata },
      });
      this.adjacency.set(id, new Map());
      this.reverseAdjacency.set(id, new Map());
    } else if (metadata && Object.keys(metadata).length > 0) {
      const existing = this.nodes.get(id);
      existing.metadata = { ...existing.metadata, ...metadata };
    }

    return this.nodes.get(id);
  }

  /**
   * Verifica se um nó existe no grafo.
   *
   * @param {string} nodeId - Identificador do nó.
   * @returns {boolean} True se o nó estiver presente.
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Retorna os metadados de um nó.
   *
   * @param {string} nodeId - Identificador do nó.
   * @returns {GraphNode|undefined} Metadados do nó ou undefined se não existir.
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Retorna todos os identificadores de nós em ordem alfabética determinística.
   *
   * @returns {string[]} Lista ordenada de nós.
   */
  getAllNodeIds() {
    return Array.from(this.nodes.keys()).sort();
  }

  /**
   * Retorna todos os objetos de nós registrados, ordenados alfabeticamente por id.
   *
   * @returns {GraphNode[]}
   */
  getAllNodes() {
    return this.getAllNodeIds().map((id) => this.nodes.get(id));
  }

  /**
   * Adiciona uma aresta direcionada (from -> to) representando uma dependência de importação.
   *
   * @param {string} from - Identificador do nó de origem (arquivo importador).
   * @param {string} to - Identificador do nó de destino (arquivo importado).
   * @param {Object} [metadata={}] - Detalhes da dependência (isTypeOnly, line, specifier, etc.).
   * @returns {GraphEdge} Aresta adicionada.
   */
  addEdge(from, to, metadata = {}) {
    if (typeof from !== 'string' || typeof to !== 'string') {
      throw new TypeError('addEdge: from e to devem ser strings válidas');
    }

    const fromId = from.trim();
    const toId = to.trim();

    this.addNode(fromId);
    this.addNode(toId);

    // Atualiza status de isolamento dos nós
    this.nodes.get(fromId).isIsolated = false;
    this.nodes.get(toId).isIsolated = false;

    const edge = {
      from: fromId,
      to: toId,
      isTypeOnly: Boolean(metadata.isTypeOnly),
      isDynamic: Boolean(metadata.isDynamic),
      isExport: Boolean(metadata.isExport),
      moduleSpecifier: metadata.moduleSpecifier || toId,
      line: metadata.line || 1,
      column: metadata.column || 1,
    };

    const fromMap = this.adjacency.get(fromId);
    if (!fromMap.has(toId)) {
      fromMap.set(toId, []);
    }
    fromMap.get(toId).push(edge);

    const toMap = this.reverseAdjacency.get(toId);
    if (!toMap.has(fromId)) {
      toMap.set(fromId, []);
    }
    toMap.get(fromId).push(edge);

    return edge;
  }

  /**
   * Retorna os nós dos quais o nó informado depende diretamente (from -> vizinho).
   *
   * @param {string} nodeId - Identificador do nó.
   * @param {Object} [options={}] - Opções de filtragem.
   * @param {boolean} [options.includeTypeOnly=true] - Se deve incluir dependências exclusivamente de tipo.
   * @returns {string[]} Lista ordenada de IDs dos nós destino.
   */
  getDependencies(nodeId, options = {}) {
    const { includeTypeOnly = true } = options;
    const neighbors = this.adjacency.get(nodeId);
    if (!neighbors) return [];

    const result = [];
    for (const [toId, edges] of neighbors.entries()) {
      if (includeTypeOnly) {
        result.push(toId);
      } else {
        const hasRuntimeEdge = edges.some((e) => !e.isTypeOnly);
        if (hasRuntimeEdge) {
          result.push(toId);
        }
      }
    }

    return result.sort();
  }

  /**
   * Retorna os nós que dependem diretamente do nó informado (vizinho -> to).
   *
   * @param {string} nodeId - Identificador do nó.
   * @param {Object} [options={}] - Opções de filtragem.
   * @param {boolean} [options.includeTypeOnly=true] - Se deve incluir dependências exclusivamente de tipo.
   * @returns {string[]} Lista ordenada de IDs dos nós importadores.
   */
  getDependents(nodeId, options = {}) {
    const { includeTypeOnly = true } = options;
    const incoming = this.reverseAdjacency.get(nodeId);
    if (!incoming) return [];

    const result = [];
    for (const [fromId, edges] of incoming.entries()) {
      if (includeTypeOnly) {
        result.push(fromId);
      } else {
        const hasRuntimeEdge = edges.some((e) => !e.isTypeOnly);
        if (hasRuntimeEdge) {
          result.push(fromId);
        }
      }
    }

    return result.sort();
  }

  /**
   * Retorna todas as arestas registradas no grafo, ordenadas deterministicamente.
   *
   * @returns {GraphEdge[]}
   */
  getAllEdges() {
    const edges = [];
    const fromIds = this.getAllNodeIds();

    for (const fromId of fromIds) {
      const neighbors = this.adjacency.get(fromId);
      const toIds = Array.from(neighbors.keys()).sort();

      for (const toId of toIds) {
        edges.push(...neighbors.get(toId));
      }
    }

    return edges;
  }

  /**
   * Identifica e retorna os nós isolados do grafo (módulos sem dependências e sem dependentes).
   *
   * @returns {string[]} Lista de IDs de nós isolados em ordem alfabética.
   */
  findIsolatedNodes() {
    const isolated = [];
    for (const [id] of this.nodes.entries()) {
      const deps = this.adjacency.get(id);
      const incoming = this.reverseAdjacency.get(id);
      const hasDeps = deps && deps.size > 0;
      const hasIncoming = incoming && incoming.size > 0;

      if (!hasDeps && !hasIncoming) {
        isolated.push(id);
      }
    }

    return isolated.sort();
  }

  /**
   * Normaliza uma representação de ciclo para chave canônica, rotacionando a sequência
   * para iniciar pelo nó lexicograficamente menor.
   *
   * Exemplo: ['c.ts', 'a.ts', 'b.ts', 'c.ts'] -> chave canônica: 'a.ts->b.ts->c.ts->a.ts'
   *
   * @param {string[]} cycleNodes - Sequência de nós com o início e o fim coincidentes.
   * @returns {string} Assinatura canônica única do ciclo.
   */
  static getCycleCanonicalKey(cycleNodes) {
    if (cycleNodes.length < 2) return cycleNodes.join('->');

    // Remove o último elemento que fecha o ciclo
    const uniqueNodes = cycleNodes.slice(0, cycleNodes.length - 1);
    let minIndex = 0;
    let minNode = uniqueNodes[0];

    for (let i = 1; i < uniqueNodes.length; i++) {
      if (uniqueNodes[i] < minNode) {
        minNode = uniqueNodes[i];
        minIndex = i;
      }
    }

    const rotated = [...uniqueNodes.slice(minIndex), ...uniqueNodes.slice(0, minIndex)];
    rotated.push(rotated[0]);
    return rotated.join('->');
  }

  /**
   * Localiza todos os ciclos direcionados no grafo utilizando DFS com coloração de nós.
   *
   * Complexidade:
   * - Temporal: O(V + E)
   * - Espacial: O(V)
   *
   * @param {Object} [options={}] - Configuração da busca.
   * @param {boolean} [options.includeTypeOnly=false] - Se true, considera imports exclusivamente de tipo.
   *                                                    Por padrão false, pois tipos não geram dependência em runtime.
   * @returns {DetectedCycle[]} Lista de ciclos únicos detectados, ordenados deterministicamente.
   */
  findCycles(options = {}) {
    const { includeTypeOnly = false } = options;

    const WHITE = 0; // Não visitado
    const GRAY = 1; // Em processamento na pilha atual
    const BLACK = 2; // Totalmente explorado

    const state = new Map();
    const allNodes = this.getAllNodeIds();
    for (const id of allNodes) {
      state.set(id, WHITE);
    }

    const pathStack = [];
    const detectedCyclesMap = new Map();

    const dfs = (currentNode) => {
      state.set(currentNode, GRAY);
      pathStack.push(currentNode);

      const neighbors = this.getDependencies(currentNode, { includeTypeOnly });

      for (const neighbor of neighbors) {
        const neighborState = state.get(neighbor);

        if (neighborState === GRAY) {
          // Encontrou aresta de retorno (back-edge) -> ciclo detectado!
          const cycleStartIndex = pathStack.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            const cyclePath = pathStack.slice(cycleStartIndex);
            cyclePath.push(neighbor); // Fecha o laço

            const canonicalKey = DependencyGraph.getCycleCanonicalKey(cyclePath);

            if (!detectedCyclesMap.has(canonicalKey)) {
              const uniqueNodesCount = cyclePath.length - 1;
              const type = uniqueNodesCount === 2 ? 'direct' : 'transitive';

              // Coleta as arestas que compõem o ciclo
              const cycleEdges = [];
              for (let i = 0; i < cyclePath.length - 1; i++) {
                const u = cyclePath[i];
                const v = cyclePath[i + 1];
                const edgesUV = this.adjacency.get(u)?.get(v) || [];
                if (edgesUV.length > 0) {
                  cycleEdges.push(edgesUV[0]);
                }
              }

              // Normaliza a ordem dos nós para começar pelo menor nó
              const canonicalNodes = canonicalKey.split('->');

              detectedCyclesMap.set(canonicalKey, {
                type,
                cycle: canonicalNodes,
                length: uniqueNodesCount,
                pathString: canonicalKey.replace(/->/g, ' -> '),
                edges: cycleEdges,
              });
            }
          }
        } else if (neighborState === WHITE) {
          dfs(neighbor);
        }
      }

      pathStack.pop();
      state.set(currentNode, BLACK);
    };

    for (const id of allNodes) {
      if (state.get(id) === WHITE) {
        dfs(id);
      }
    }

    // Ordenação determinística: primeiro ciclos diretos, depois por comprimento, depois lexicográfico
    return Array.from(detectedCyclesMap.values()).sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.pathString.localeCompare(b.pathString);
    });
  }

  /**
   * Verifica rapidamente se o grafo contém ao menos um ciclo.
   *
   * @param {Object} [options={}] - Opções de checagem.
   * @param {boolean} [options.includeTypeOnly=false] - Se true, inclui imports de tipo.
   * @returns {boolean} True se houver ciclo.
   */
  hasCycles(options = {}) {
    return this.findCycles(options).length > 0;
  }

  /**
   * Exporta a lista de adjacência do grafo para inspeção ou serialização.
   *
   * @param {Object} [options={}] - Opções de exportação.
   * @returns {Record<string, string[]>} Mapeamento nó -> dependências.
   */
  toAdjacencyList(options = {}) {
    const list = {};
    for (const id of this.getAllNodeIds()) {
      list[id] = this.getDependencies(id, options);
    }
    return list;
  }

  /**
   * Serializa o grafo em formato JSON estruturado.
   *
   * @returns {Object} Representação serializada completa.
   */
  toJSON() {
    return {
      nodes: this.getAllNodes(),
      edges: this.getAllEdges(),
      isolatedNodes: this.findIsolatedNodes(),
      hasCycles: this.hasCycles(),
    };
  }
}

/**
 * Constrói um Grafo Direcionado de Dependências a partir de uma lista de arquivos de entrada,
 * analisando sintaticamente cada arquivo e resolvendo imports relativos e aliases TypeScript.
 *
 * @param {string[]} filePaths - Lista de caminhos relativos ou absolutos dos arquivos a analisar.
 * @param {Object} [options={}] - Opções de construção.
 * @param {string} [options.projectRoot=process.cwd()] - Raiz do projeto.
 * @param {string} [options.tsConfigPath='tsconfig.json'] - Caminho do tsconfig.json.
 * @param {boolean} [options.includeExternal=false] - Se deve registrar pacotes externos como nós no grafo.
 * @param {boolean} [options.resolveAliases=true] - Se deve resolver aliases (@/*) para arquivos no disco.
 * @returns {DependencyGraph} Grafo preenchido com todos os nós e arestas detectados.
 */
export function buildDependencyGraph(filePaths, options = {}) {
  const {
    projectRoot = process.cwd(),
    tsConfigPath = 'tsconfig.json',
    includeExternal = false,
  } = options;

  const graph = new DependencyGraph();

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return graph;
  }

  for (const filePath of filePaths) {
    try {
      const normalizedSource = normalizePath(
        path.isAbsolute(filePath) ? path.relative(projectRoot, filePath) : filePath
      );

      graph.addNode(normalizedSource);
      const deps = extractDependenciesFromSource(filePath, projectRoot);

      for (const dep of deps) {
        const resolution = resolveModule(dep.moduleSpecifier, filePath, {
          projectRoot,
          tsConfigPath,
        });

        if (resolution.status === 'resolved' && resolution.isLocal && resolution.resolvedPath) {
          graph.addEdge(dep.sourceFile, resolution.resolvedPath, {
            isTypeOnly: dep.isTypeOnly,
            isDynamic: dep.isDynamic,
            isExport: dep.isExport,
            moduleSpecifier: dep.moduleSpecifier,
            line: dep.line,
            column: dep.column,
          });
        } else if (includeExternal && resolution.isExternal) {
          const externalId = `external:${dep.moduleSpecifier}`;
          graph.addNode(externalId, {}, true);
          graph.addEdge(dep.sourceFile, externalId, {
            isTypeOnly: dep.isTypeOnly,
            isDynamic: dep.isDynamic,
            isExport: dep.isExport,
            moduleSpecifier: dep.moduleSpecifier,
            line: dep.line,
            column: dep.column,
          });
        }
      }
    } catch (error) {
      // Registra o nó com erro nos metadados para auditoria rastreável
      const safeId = normalizePath(
        path.isAbsolute(filePath) ? path.relative(projectRoot, filePath) : filePath
      );
      graph.addNode(safeId, { error: error.message });
    }
  }

  return graph;
}
