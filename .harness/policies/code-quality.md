# Política Canônica de Qualidade de Código (`code-quality.md`)

> **Projeto:** ExtensionTools  
> **Classificação:** PUBLIC REPOSITORY (Safe-by-Default)  
> **Identificador da Política:** `POL-ENG-02`  
> **Versão:** `1.0.0`  
> **Status:** CANÔNICA E VIGENTE  
> **Agente Guardião:** `developer` e `code-reviewer`  

---

## 1. Identificação e Finalidade

O projeto **ExtensionTools** prima pela sustentabilidade, legibilidade e segurança operacional do seu código-fonte.

A finalidade desta política é estabelecer os **padrões mandatórios de escrita em TypeScript estrito, React 19 e Clean Code**, assegurando que todo código introduzido no repositório seja autoexplicativo, fortemente tipado, defensivo contra exceções e livre de débitos técnicos ocultos.

---

## 2. Escopo de Aplicação

Esta política aplica-se a todos os arquivos de código TypeScript (`.ts`), React (`.tsx`) e módulos Node.js (`.mjs`) sob os diretórios `src/`, `scripts/` e `tests/`.

---

## 3. Padrões Mandatórios de Tipagem e TypeScript

1. **Veto Absoluto ao Tipo `any`:**
   - É terminantemente proibido o uso de `any` explícito (`: any`, `as any`) ou inferido.
   - Em cenários de incerteza de tipo ou parsing de payloads externos (JSON, storage, mensagens), utilize obrigatoriamente `unknown` acompanhado de validação de esquema ou type guards com asserções refinadas (`typeof`, `instanceof` ou funções predicadas `isTipo(x): x is Tipo`).
2. **Tipagem Estrita e Ativa (`strict: true`):**
   - Respeitar 100% das regras de `tsconfig.json` (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`).
   - Evitar asserções não nulas forçadas com o operador `!` (`obj!.prop`). Prefira tratamento defensivo com optional chaining (`obj?.prop`) e valores padrão de fallback.
3. **Imutabilidade e Segurança de Dados:**
   - Prefira declarações `readonly` em arrays e propriedades de interfaces para prevenir mutações acidentais de estado.
   - Trate entradas e parâmetros de funções como imutáveis.

---

## 4. Padrões de Componentes React 19 e UI

1. **Separação entre Apresentação e Domínio:**
   - Componentes visuais sob `ui/` devem se concentrar em renderização, acessibilidade e experiência do usuário.
   - Cálculos pesados, formatações lógicas, algoritmos de diff e parsers devem residir em funções puras em `core/` ou em custom hooks dedicados.
2. **Pureza e Efeitos Colaterais:**
   - Evite efeitos colaterais desnecessários em `useEffect`. Prefira handlers de eventos e computação derivada durante a renderização (`useMemo`).
3. **Manipulação Segura do DOM:**
   - É expressamente proibida a manipulação manual e direta do DOM (`document.getElementById`, `innerHTML`) sobre elementos gerenciados pela árvore do React.
   - Higienização obrigatória contra Cross-Site Scripting (XSS) em qualquer renderização de conteúdo externo ou HTML dinâmico.

---

## 5. Padrões de Estilo, Linters e Documentação Inline

1. **Conformidade Mecânica Contínua:**
   - Todo código deve passar com zero divergências na verificação do Prettier (`pnpm run format:check`).
   - Todo código deve passar com zero erros e zero advertências no ESLint 10 (`pnpm run lint`).
2. **Proibição de Supressões Silenciosas:**
   - É expressamente proibido o uso indiscriminado de comentários como `// @ts-ignore`, `// @ts-nocheck` ou `/* eslint-disable */` para forçar aprovação mecânica.
   - Se uma supressão for comprovadamente indispensável por limitação de biblioteca externa, ela deve ser acompanhada por comentário justificando a necessidade e autorizada em code review.
3. **Documentação Inline Significativa:**
   - Comentários no código devem explicar o **porquê** de decisões não óbvias, invariantes e restrições arquiteturais.
   - Não comente trivialidades que apenas repitam o que a instrução do código já expressa.
   - Comentários normativos e JSDoc devem ser redigidos em português do Brasil (pt-BR).

---

## 6. Procedimentos e Comportamentos Esperados

1. **Funções Pequenas e Coesas:** Cada função deve ter responsabilidade unívoca, nome declarativo e baixa complexidade ciclomática.
2. **Refatoração com Preservação de Comportamento:** Melhorias de legibilidade não devem alterar o contrato observável de chamadas, a menos que uma alteração funcional esteja prevista na tarefa.

---

## 7. Tratamento de Violações e Bloqueios

Se um código for submetido com violações desta política:
1. Os Quality Gates `QG-03 (Static Code Quality)` ou testes unitários falham na esteira.
2. O agente revisor (`code-reviewer`) emite parecer de reprovação apontando os débitos técnicos no diff.
3. O agente implementador (`developer`) deve refatorar o código até alcançar aprovação total dos comandos estáticos.

---

## 8. Critérios Verificáveis de Conformidade (QG-03)

- [ ] `pnpm run compile` (`tsc --noEmit`) executado com código de saída `0` e zero erros de tipo.
- [ ] `pnpm run lint` (`eslint .`) executado com código de saída `0` e zero advertências.
- [ ] `pnpm run format:check` (`prettier --check .`) aprovado em 100% dos arquivos do repositório.
- [ ] Zero ocorrências injustificadas de `any` ou `@ts-ignore` no diff inspecionado.

---

## 9. Referências Cruzadas

- Identidade Visual: `DESIGN.md` (Design System Minimalista)
- Quality Gate: `docs/quality-gates/03-static-code-quality.md` (`QG-03`)
- Procedimentos: `.harness/skills/code-review/SKILL.md` e `.harness/skills/implementation/SKILL.md`
- Contratos: [`agent-input-contract.md`](../contracts/agent-input-contract.md) e [`agent-output-contract.md`](../contracts/agent-output-contract.md)
