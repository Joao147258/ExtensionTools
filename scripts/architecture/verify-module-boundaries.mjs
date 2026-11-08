/**
 * ==============================================================================
 * Projeto: ExtensionTools
 * Módulo: scripts/architecture/verify-module-boundaries.mjs
 * Responsabilidade: Verificador estático de limites e fronteiras modulares da
 *                  arquitetura Feature-First, aplicando as regras ARC-R01 a ARC-R08.
 *
 * Propósito:
 * Sustentar o Quality Gate `QG-02 — Architecture Boundaries` conforme estabelecido
 * em `ARCHITECTURE.md` e `docs/quality-gates/02-architecture-boundaries.md`.
 *
 * Catálogo de Regras Implementadas:
 * - ARC-R01: Isolamento Estrito entre Features (Cross-Feature Import proibido)
 * - ARC-R02: Encapsulamento por API Pública (Entrypoints devem consumir apenas index.ts)
 * - ARC-R03: Pureza de Domínio e Core (Core/Domain livres de React, JSX, UI e Platform)
 * - ARC-R04: Inversão de Dependência em Application (Application não importa Infrastructure)
 * - ARC-R05: Isolamento de Shared (Shared não depende de camadas superiores)
 * - ARC-R06: Isolamento de Platform (Platform não depende de Features ou Entrypoints)
 * - ARC-R08: Resolução Canônica de Aliases (Fiscalização transversal de aliases @/*)
 *
 * Princípios de Engenharia:
 * 1. Resolução Efetiva: As regras são aplicadas aos caminhos físicos resolvidos no disco,
 *    garantindo que aliases ou imports relativos complexos não contornem as barreiras.
 * 2. Determinismo: Ordem previsível e diagnósticos rastreáveis com arquivo, linha, coluna,
 *    evidência textual e orientação de remediação.
 * 3. Tolerância a Erros: Tratamento seguro de caminhos não resolvidos e distinção
 *    entre violação arquitetural (exit 1) e erro de execução/sintaxe (exit 2).
 * ==============================================================================
 */

import path from 'node:path';
import { normalizePath } from '../lib/fs-utils.mjs';
import {
  extractDependenciesFromSource,
  resolveModule,
  loadTsConfig,
} from '../lib/ast-analyzer.mjs';

/**
 * Estrutura de uma violação arquitetural detectada.
 * @typedef {Object} BoundaryViolation
 * @property {string} ruleId - Identificador canônico da regra (ex: 'ARC-R01', 'ARC-R02').
 * @property {string} file - Caminho relativo do arquivo que cometeu a violação.
 * @property {number} line - Linha da declaração (1-indexed).
 * @property {number} column - Coluna da declaração (1-indexed).
 * @property {string} target - Caminho resolvido ou especificador importado.
 * @property {string} moduleSpecifier - Especificador original no código.
 * @property {string} message - Descrição objetiva da infração.
 * @property {string} evidence - Trecho evidenciando o import/export.
 * @property {string} remediation - Sugestão concreta para correção arquitetural.
 * @property {boolean} isTypeOnly - Se a declaração era exclusivamente de tipo.
 * @property {boolean} [viaAlias] - Se o import utilizou alias TypeScript.
 */

/**
 * Classificação estrutural de um caminho de arquivo no projeto.
 * @typedef {Object} PathClassification
 * @property {'entrypoints' | 'features' | 'platform' | 'shared' | 'unknown'} layer - Camada do módulo.
 * @property {string|null} featureName - Nome da feature se layer === 'features'.
 * @property {'core' | 'domain' | 'application' | 'infrastructure' | 'ui' | 'root' | null} sublayer - Subcamada interna.
 * @property {boolean} isPublicEntrypoint - True se for o index.ts público da feature.
 * @property {string} relativePath - Caminho normalizado relativo.
 */

/**
 * Classifica um caminho de arquivo em camadas da arquitetura Feature-First.
 * Suporta tanto a estrutura padrão sob `src/` quanto subpastas em testes ou fixtures sintéticas.
 *
 * @param {string} rawPath - Caminho do arquivo a ser classificado.
 * @param {string} [projectRoot=process.cwd()] - Raiz do projeto.
 * @returns {PathClassification} Classificação estruturada do caminho.
 */
export function classifyModulePath(rawPath, projectRoot = process.cwd()) {
  const norm = normalizePath(
    path.isAbsolute(rawPath) ? path.relative(projectRoot, rawPath) : rawPath
  );

  // 1. Identificação de Features (ex: src/features/<feat>/... ou .../features/<feat>/...)
  const featMatch = norm.match(/(?:^|\/)(?:src\/)?features\/([^/]+)(?:\/(.*))?$/);
  if (featMatch) {
    const featureName = featMatch[1];
    const sub = featMatch[2] || '';
    let isPublicEntrypoint = false;
    let sublayer = 'root';

    if (/^index\.(ts|tsx|js|jsx)$/.test(sub)) {
      isPublicEntrypoint = true;
      sublayer = 'root';
    } else if (sub.startsWith('core/') || /^core\./.test(sub)) {
      sublayer = 'core';
    } else if (sub.startsWith('domain/') || /^domain\./.test(sub)) {
      sublayer = 'domain';
    } else if (sub.startsWith('application/') || /^application\./.test(sub)) {
      sublayer = 'application';
    } else if (
      sub.startsWith('infrastructure/') ||
      sub.startsWith('infra/') ||
      /^(infrastructure|infra)\./.test(sub)
    ) {
      sublayer = 'infrastructure';
    } else if (sub.startsWith('ui/') || /^ui\./.test(sub)) {
      sublayer = 'ui';
    }

    return {
      layer: 'features',
      featureName,
      sublayer,
      isPublicEntrypoint,
      relativePath: norm,
    };
  }

  // 2. Identificação de Entrypoints (ex: src/entrypoints/... ou .../entrypoints/...)
  if (/(?:^|\/)(?:src\/)?entrypoints\//.test(norm)) {
    return {
      layer: 'entrypoints',
      featureName: null,
      sublayer: null,
      isPublicEntrypoint: false,
      relativePath: norm,
    };
  }

  // 3. Identificação de Platform (ex: src/platform/... ou .../platform/...)
  if (/(?:^|\/)(?:src\/)?platform\//.test(norm)) {
    return {
      layer: 'platform',
      featureName: null,
      sublayer: null,
      isPublicEntrypoint: false,
      relativePath: norm,
    };
  }

  // 4. Identificação de Shared (ex: src/shared/... ou .../shared/...)
  if (/(?:^|\/)(?:src\/)?shared\//.test(norm)) {
    const sharedSubMatch = norm.match(/(?:^|\/)(?:src\/)?shared\/([^/]+)/);
    return {
      layer: 'shared',
      featureName: null,
      sublayer: sharedSubMatch ? sharedSubMatch[1] : null,
      isPublicEntrypoint: false,
      relativePath: norm,
    };
  }

  return {
    layer: 'unknown',
    featureName: null,
    sublayer: null,
    isPublicEntrypoint: false,
    relativePath: norm,
  };
}

/**
 * Verifica violação da regra ARC-R01: Isolamento Estrito entre Features distintas.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido da dependência.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados sintáticos da dependência.
 * @returns {BoundaryViolation|null} Violação identificada ou null.
 */
export function checkCrossFeatureImport(sourceClass, targetClass, dep) {
  if (sourceClass.layer !== 'features' || targetClass.layer !== 'features') {
    return null;
  }

  if (!sourceClass.featureName || !targetClass.featureName) {
    return null;
  }

  // Se são features diferentes, é expressamente proibido
  if (sourceClass.featureName !== targetClass.featureName) {
    const isAlias = dep.moduleSpecifier.startsWith('@/') || dep.moduleSpecifier.startsWith('~/');
    return {
      ruleId: 'ARC-R01',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Importação cruzada direta entre features não é permitida: a feature '${sourceClass.featureName}' tenta importar da feature '${targetClass.featureName}'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Elimine o acoplamento cruzado. Promova funcionalidades compartilhadas para 'src/platform/' ou 'src/shared/', ou orquestre a integração no nível de 'src/entrypoints/'.`,
      isTypeOnly: dep.isTypeOnly,
      viaAlias: isAlias,
    };
  }

  return null;
}

/**
 * Verifica violação da regra ARC-R02: Encapsulamento por API Pública de Features.
 * Entrypoints (ou consumidores externos) só podem importar features a partir de seu index.ts.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados da dependência.
 * @returns {BoundaryViolation|null}
 */
export function checkEntrypointPublicApi(sourceClass, targetClass, dep) {
  // Apenas relevante quando o alvo é uma feature
  if (targetClass.layer !== 'features') {
    return null;
  }

  // Se a origem é a própria feature, não se aplica (acesso interno intra-feature é permitido)
  if (sourceClass.layer === 'features' && sourceClass.featureName === targetClass.featureName) {
    return null;
  }

  // Se o consumidor externo tenta acessar arquivos internos que não sejam o index.ts público
  if (!targetClass.isPublicEntrypoint) {
    const isAlias = dep.moduleSpecifier.startsWith('@/') || dep.moduleSpecifier.startsWith('~/');
    return {
      ruleId: 'ARC-R02',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Acesso ilegal a arquivo interno da feature '${targetClass.featureName}'. Módulos externos devem importar exclusivamente através da API pública da feature ('index.ts').`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Exporte os componentes ou funções necessários no arquivo 'src/features/${targetClass.featureName}/index.ts' e importe a partir dele.`,
      isTypeOnly: dep.isTypeOnly,
      viaAlias: isAlias,
    };
  }

  return null;
}

/**
 * Verifica violação da regra ARC-R03: Pureza de Domínio e Core.
 * Core e Domain devem ser 100% livres de React, JSX, componentes UI e dependências de Platform.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados da dependência.
 * @returns {BoundaryViolation|null}
 */
export function checkCoreDomainPurity(sourceClass, targetClass, dep) {
  if (sourceClass.layer !== 'features') {
    return null;
  }

  if (sourceClass.sublayer !== 'core' && sourceClass.sublayer !== 'domain') {
    return null;
  }

  const spec = dep.moduleSpecifier.toLowerCase();

  // 1. Verificação de dependências de terceiros proibidas em Core/Domain (React, WXT, DOM)
  const forbiddenThirdPartyPackages = [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@wxt-dev/module-react',
    'tailwindcss',
    '@tailwindcss/vite',
  ];

  for (const pkg of forbiddenThirdPartyPackages) {
    if (spec === pkg || spec.startsWith(`${pkg}/`)) {
      return {
        ruleId: 'ARC-R03',
        file: dep.sourceFile,
        line: dep.line,
        column: dep.column,
        target: spec,
        moduleSpecifier: dep.moduleSpecifier,
        message: `Violação da pureza de Core/Domain: arquivos sob '${sourceClass.sublayer}/' não podem importar pacotes visuais ou de UI ('${dep.moduleSpecifier}').`,
        evidence: `import ... from '${dep.moduleSpecifier}'`,
        remediation: `Mova a lógica visual para a camada 'ui/' da feature ou remova a dependência de framework da camada de domínio.`,
        isTypeOnly: dep.isTypeOnly,
      };
    }
  }

  // 2. Verificação de imports apontando para subcamada UI
  if (targetClass.layer === 'features' && targetClass.sublayer === 'ui') {
    return {
      ruleId: 'ARC-R03',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação da pureza de Core/Domain: '${sourceClass.sublayer}/' não pode importar da camada visual 'ui/'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Inverta a dependência: a camada 'ui/' pode consumir 'core/' ou 'domain/', mas nunca o contrário.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  // 3. Verificação de imports apontando para Platform (exceto se for import exclusivamente de tipos puros)
  if (targetClass.layer === 'platform' && !dep.isTypeOnly) {
    return {
      ruleId: 'ARC-R03',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação da pureza de Core/Domain: '${sourceClass.sublayer}/' não pode importar módulos executáveis de 'platform/'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Utilize Inversão de Dependência (interfaces/ports declaradas no próprio core/domain) e implemente adaptadores em platform/ ou application/.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  // 4. Verificação de imports apontando para Shared UI
  if (targetClass.layer === 'shared' && targetClass.sublayer === 'ui') {
    return {
      ruleId: 'ARC-R03',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação da pureza de Core/Domain: '${sourceClass.sublayer}/' não pode importar componentes de 'shared/ui/'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Componentes visuais devem ser importados apenas por arquivos sob 'ui/' ou 'entrypoints/'.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  return null;
}

/**
 * Verifica violação da regra ARC-R04: Inversão de Dependência em Application.
 * Application não pode importar diretamente adaptadores concretos de Infrastructure.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados da dependência.
 * @returns {BoundaryViolation|null}
 */
export function checkApplicationInfraInversion(sourceClass, targetClass, dep) {
  if (sourceClass.layer !== 'features' || targetClass.layer !== 'features') {
    return null;
  }

  if (sourceClass.sublayer === 'application' && targetClass.sublayer === 'infrastructure') {
    return {
      ruleId: 'ARC-R04',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação de Inversão de Dependência em Application: a camada 'application/' não pode importar diretamente adaptadores de 'infrastructure/'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Defina uma interface de contrato (Port) na camada 'domain/' e faça a infraestrutura implementar essa interface.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  return null;
}

/**
 * Verifica violação da regra ARC-R05: Isolamento de Shared.
 * A camada Shared não pode importar de Features, Platform ou Entrypoints.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados da dependência.
 * @returns {BoundaryViolation|null}
 */
export function checkSharedIsolation(sourceClass, targetClass, dep) {
  if (sourceClass.layer !== 'shared') {
    return null;
  }

  if (
    targetClass.layer === 'features' ||
    targetClass.layer === 'platform' ||
    targetClass.layer === 'entrypoints'
  ) {
    return {
      ruleId: 'ARC-R05',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação de isolamento de Shared: a camada basal 'shared/' não pode importar de camadas superiores ('${targetClass.layer}/').`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `Remova a dependência de camada superior. Shared deve conter apenas utilitários universais, primitivas e contratos independentes.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  return null;
}

/**
 * Verifica violação da regra ARC-R06: Isolamento de Platform.
 * A camada Platform não pode importar de Features ou Entrypoints.
 *
 * @param {PathClassification} sourceClass - Origem da dependência.
 * @param {PathClassification} targetClass - Destino resolvido.
 * @param {import('../lib/ast-analyzer.mjs').ModuleDependency} dep - Dados da dependência.
 * @returns {BoundaryViolation|null}
 */
export function checkPlatformIsolation(sourceClass, targetClass, dep) {
  if (sourceClass.layer !== 'platform') {
    return null;
  }

  if (targetClass.layer === 'features' || targetClass.layer === 'entrypoints') {
    return {
      ruleId: 'ARC-R06',
      file: dep.sourceFile,
      line: dep.line,
      column: dep.column,
      target: targetClass.relativePath,
      moduleSpecifier: dep.moduleSpecifier,
      message: `Violação de isolamento de Platform: 'platform/' não pode importar de '${targetClass.layer}/'.`,
      evidence: `import ... from '${dep.moduleSpecifier}'`,
      remediation: `A camada platform deve fornecer recursos de navegador e sistema agnósticos a regras de negócio de features ou views de entrypoints.`,
      isTypeOnly: dep.isTypeOnly,
    };
  }

  return null;
}

/**
 * Executa a fiscalização completa de limites e fronteiras modulares sobre
 * uma lista de arquivos de código-fonte ou dependências previamente extraídas.
 *
 * @param {string[]|import('../lib/ast-analyzer.mjs').ModuleDependency[]} inputFilesOrDeps - Lista de caminhos de arquivos ou dependências.
 * @param {Object} [options={}] - Opções de configuração da verificação.
 * @param {string} [options.projectRoot=process.cwd()] - Raiz do projeto.
 * @param {string} [options.tsConfigPath='tsconfig.json'] - Caminho do tsconfig.json.
 * @param {import('../lib/ast-analyzer.mjs').TsConfigOptions} [options.tsConfig=null] - Configuração tsconfig pré-carregada.
 * @returns {{ violations: BoundaryViolation[], checkedFilesCount: number, checkedDependenciesCount: number, operationalErrors: string[] }}
 */
export function verifyModuleBoundaries(inputFilesOrDeps, options = {}) {
  const { projectRoot = process.cwd(), tsConfigPath = 'tsconfig.json', tsConfig = null } = options;

  const resolvedTsConfig = tsConfig || loadTsConfig(tsConfigPath, projectRoot);
  const violations = [];
  const operationalErrors = [];
  let checkedFilesCount;
  let checkedDependenciesCount;

  if (!Array.isArray(inputFilesOrDeps) || inputFilesOrDeps.length === 0) {
    return {
      violations: [],
      checkedFilesCount: 0,
      checkedDependenciesCount: 0,
      operationalErrors: [],
    };
  }

  // Distingue se a entrada é uma lista de strings (caminhos) ou objetos ModuleDependency
  const isPathList = typeof inputFilesOrDeps[0] === 'string';

  let dependenciesToAnalyze = [];

  if (isPathList) {
    checkedFilesCount = inputFilesOrDeps.length;
    for (const filePath of inputFilesOrDeps) {
      try {
        const deps = extractDependenciesFromSource(filePath, projectRoot);
        dependenciesToAnalyze.push(...deps);
      } catch (err) {
        operationalErrors.push(`Falha ao extrair dependências de "${filePath}": ${err.message}`);
      }
    }
  } else {
    dependenciesToAnalyze = inputFilesOrDeps;
    const uniqueFiles = new Set(inputFilesOrDeps.map((d) => d.sourceFile));
    checkedFilesCount = uniqueFiles.size;
  }

  checkedDependenciesCount = dependenciesToAnalyze.length;

  for (const dep of dependenciesToAnalyze) {
    const sourceClass = classifyModulePath(dep.sourceFile, projectRoot);

    // Resolução do módulo
    const resolution = resolveModule(dep.moduleSpecifier, dep.sourceFile, {
      projectRoot,
      tsConfig: resolvedTsConfig,
    });

    // Fiscalização da regra ARC-R08 (Tratamento de aliases não resolvidos)
    const isAlias = dep.moduleSpecifier.startsWith('@/') || dep.moduleSpecifier.startsWith('~/');

    if (resolution.status === 'unresolved') {
      if (isAlias) {
        violations.push({
          ruleId: 'ARC-R08',
          file: dep.sourceFile,
          line: dep.line,
          column: dep.column,
          target: dep.moduleSpecifier,
          moduleSpecifier: dep.moduleSpecifier,
          message: `Alias TypeScript inválido ou não resolvido no disco: '${dep.moduleSpecifier}'. Todos os aliases devem apontar para módulos locais existentes.`,
          evidence: `import ... from '${dep.moduleSpecifier}'`,
          remediation: `Verifique a grafia do caminho ou as regras de mapeamento de paths em 'tsconfig.json'.`,
          isTypeOnly: dep.isTypeOnly,
          viaAlias: true,
        });
      } else if (resolution.isLocal) {
        operationalErrors.push(
          `Módulo local não encontrado: "${dep.moduleSpecifier}" importado em "${dep.sourceFile}:${dep.line}"`
        );
      }
      continue;
    }

    // Se for pacote de terceiro (externo)
    if (resolution.isExternal) {
      // Regra ARC-R03 também verifica pacotes externos (ex: 'react' em core/domain)
      const targetClass = {
        layer: 'unknown',
        featureName: null,
        sublayer: null,
        isPublicEntrypoint: false,
        relativePath: dep.moduleSpecifier,
      };

      const r03Violation = checkCoreDomainPurity(sourceClass, targetClass, dep);
      if (r03Violation) {
        violations.push(r03Violation);
      }
      continue;
    }

    // Módulo local resolvido no disco
    const targetClass = classifyModulePath(resolution.resolvedPath, projectRoot);

    // Aplicação das regras de limites
    const r01 = checkCrossFeatureImport(sourceClass, targetClass, dep);
    if (r01) {
      violations.push(r01);
      continue;
    }

    const r02 = checkEntrypointPublicApi(sourceClass, targetClass, dep);
    if (r02) {
      violations.push(r02);
      continue;
    }

    const r03 = checkCoreDomainPurity(sourceClass, targetClass, dep);
    if (r03) {
      violations.push(r03);
      continue;
    }

    const r04 = checkApplicationInfraInversion(sourceClass, targetClass, dep);
    if (r04) {
      violations.push(r04);
      continue;
    }

    const r05 = checkSharedIsolation(sourceClass, targetClass, dep);
    if (r05) {
      violations.push(r05);
      continue;
    }

    const r06 = checkPlatformIsolation(sourceClass, targetClass, dep);
    if (r06) {
      violations.push(r06);
      continue;
    }
  }

  // Ordenação determinística das violações por arquivo, linha, coluna e ruleId
  violations.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.ruleId.localeCompare(b.ruleId);
  });

  return {
    violations,
    checkedFilesCount,
    checkedDependenciesCount,
    operationalErrors,
  };
}
