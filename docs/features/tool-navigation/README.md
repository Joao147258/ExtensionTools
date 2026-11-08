# Especificação Funcional — Tool Navigation (`FEAT-NAV`)

> **Projeto:** ExtensionTools  
> **Identificador:** `FEAT-NAV`  
> **Status:** ESPECIFICADA — PRONTA PARA IMPLEMENTAÇÃO (M3-PHASE-1 / Bloco 1)  
> **Papel Arquitetural:** Capacidade Estrutural da Plataforma (Navegação & Seleção)  
> **Diretório:** `docs/features/tool-navigation/`  
> **Arquitetura Base:** [`ARCHITECTURE.md`](../../../ARCHITECTURE.md)  
> **Design System:** [`DESIGN.md`](../../../DESIGN.md)  
> **Decisão Vinculada:** [`ADR-005`](../../architecture/adr/ADR-005-composicao-sidepanel-shell-navegacao.md)  

---

## 1. Propósito e Problema Resolvido

O ExtensionTools reúne 12 ferramentas de finalidades distintas em uma única interface no Side Panel.

A **Tool Navigation** é o mecanismo responsável por apresentar os destinos disponíveis, indicar visualmente qual ferramenta está ativa e comunicar intenções de alternância de tela para o contêiner de composição da aplicação.

### Por que a Navegação Deve ser Desacoplada das Ferramentas?
Se a barra de navegação contivesse referências duras ou conhecesse os detalhes internos de cada utilitário:
1. A inclusão de uma nova ferramenta (como `xml-inspector` em M5) exigiria refatorar a navegação inteira.
2. Criar-se-iam importações cruzadas entre a barra de ferramentas e os componentes das features, violando a regra `ARC-R01` do Boundary Linter.
3. Testar a navegação exigiria instanciar o catálogo inteiro de utilitários pesados.

---

## 2. Responsabilidades Principais

1. **Apresentação de Destinos:** Renderizar a listagem ou barra de abas compactas representando as ferramentas disponíveis.
2. **Identificação da Seleção Atual:** Destacar visualmente o item ativo utilizando os tokens de foco e acento Brand Red (`#DF2531`) definidos em `DESIGN.md`.
3. **Despacho Determinístico de Eventos:** Disparar um callback strongly-typed quando o usuário clica ou aciona uma ferramenta via teclado.
4. **Navegação Totalmente Acessível:** Permitir alternância ágil de ferramentas através de teclado (`Tab`, `Shift+Tab`, `ArrowLeft`, `ArrowRight`, `Enter`, `Space`), com indicadores de foco visíveis (`focus-visible`) e semântica ARIA (`role="tablist"`, `role="tab"`, `aria-selected`).

---

## 3. Contrato Funcional e Tipagem

A Tool Navigation é implementada como um **componente controlado puro**, cuja interface TypeScript é formalizada da seguinte maneira:

```typescript
/**
 * Metadados essenciais de um destino de navegação.
 */
export interface ToolNavigationItem {
  id: string;              // Identificador unívoco da ferramenta (ex: 'text-diff')
  label: string;           // Rótulo textual legível apresentado na interface
  description?: string;    // Breve resumo para acessibilidade / tooltip
  icon?: string;           // Identificador do ícone primitivo
  badge?: string;          // Etiqueta opcional (ex: 'Piloto', 'Beta', 'Em breve')
  disabled?: boolean;      // Bloqueio temporário quando a feature estiver em construção
}

/**
 * Propriedades do componente de navegação.
 */
export interface ToolNavigationProps {
  tools: readonly ToolNavigationItem[];     // Catálogo imutável de ferramentas disponíveis
  activeToolId: string;                     // ID da ferramenta atualmente ativa
  onSelectTool: (toolId: string) => void;   // Callback disparado ao selecionar novo destino
  className?: string;                       // Classes complementares de estilização
}
```

---

## 4. Fonte de Verdade da Seleção (`Single Source of Truth`)

Para evitar divergências de estado e re-renderizações inconsistentes:
- **A Tool Navigation NÃO mantém estado interno da ferramenta ativa.**
- A fonte de verdade do `activeToolId` reside unicamente no componente de composição da aplicação (`SidePanelApp.tsx`).
- O fluxo de dados é rigorosamente unidirecional:
  ```text
  SidePanelApp (Estado: activeToolId)
        │
        ├─► Propaga activeToolId e tools ──► ToolNavigation
        │
        └─◄ Recebe onSelectTool(newId) ◄───── ToolNavigation (Clique / Teclado)
  ```

---

## 5. Limites Arquiteturais Inegociáveis

- ❌ **Zero Execução de Negócio:** A Tool Navigation nunca importa cálculos, parsers ou componentes internos de features (`src/features/text-diff/core`).
- ❌ **Zero APIs de Navegador:** A navegação não chama `chrome.storage` ou `chrome.tabs`. Ela comunica intenções à camada de composição.
- ❌ **Sem Dependência de Roteadores Pesados:** No Bloco 1, veta-se a introdução de bibliotecas pesadas como React Router. O controle de destinos opera via estado atômico controlado e renderização condicional.

---

## 6. Estados Visuais dos Destinos

| Estado | Aparência Visual (`DESIGN.md`) | Acessibilidade ARIA |
| :--- | :--- | :--- |
| **Normal (Inativo)** | Fundo transparente, texto cinza claro (`#A1A1AA`), borda neutra sutil. | `aria-selected="false"`, `tabindex="-1"` |
| **Ativo (Selecionado)** | Fundo `#1E1E22`, acento de borda inferior em Brand Red (`#DF2531`), texto branco puro (`#FFFFFF`). | `aria-selected="true"`, `tabindex="0"` |
| **Hover** | Overlay sutil em `rgba(223, 37, 49, 0.15)`, cursor pointer. | - |
| **Foco Visível** | Anel nítido de foco `2px solid #DF2531` com offset de `2px` ao navegar via teclado. | Indicador de foco evidente (WCAG 2.2 AA) |
| **Desabilitado** | Opacidade reduzida para 40%, cursor `not-allowed`, clique desativado. | `aria-disabled="true"` |

---

## 7. Estratégia de Testes Automatizados

1. **Testes Unitários no Vitest (`tests/unit/tool-navigation/`):**
   - Renderização correta da lista completa de itens fornecidos.
   - Aplicação dos atributos ARIA corretos no item ativo (`aria-selected="true"`).
   - Disparo correto do callback `onSelectTool` com o ID da ferramenta ao clicar em um destino inativo.
   - Não-disparo do callback ao clicar em ferramentas marcadas com `disabled: true`.
   - Navegação por teclado: verificação de troca de foco ao pressionar setas direcionais.
2. **Resiliência a Falhas:**
   - Comportamento seguro caso `tools` seja uma lista vazia ou caso `activeToolId` não exista na lista (fallback gracioso sem exceptions).

---

## 8. Critérios de Aceitação Verificáveis (Definition of Done)

- [ ] Componente `ToolNavigation` implementado em `src/features/tool-navigation/` e exportado via `index.ts`.
- [ ] Tipos `ToolNavigationItem` e `ToolNavigationProps` formalizados e exportados.
- [ ] Atributos semânticos ARIA para abas (`role="tablist"`, `role="tab"`) 100% conformes.
- [ ] Navegação completa por teclado operando sem necessidade de mouse.
- [ ] 100% dos testes unitários da navegação passando com louvor no Vitest.
- [ ] Zero violações de arquitetura detectadas pelo Boundary Linter (`QG-02`).
