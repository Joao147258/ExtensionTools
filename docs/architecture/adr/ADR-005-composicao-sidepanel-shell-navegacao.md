# ADR-005 — Composição do Side Panel Shell e Mecanismo de Navegação Desacoplado

> **Identificador:** `ADR-005`  
> **Título:** Estratégia de Composição do Side Panel Shell e Mecanismo de Navegação Desacoplado para M3  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 07/11/2026 (Marco M3 / Bloco 1)  
> **Autoridade:** `Architect`  
> **Escopo:** Entrypoints WXT, casca da interface e composição da aplicação  

---

## 1. Contexto e Problema de Engenharia

O marco **M3 — Product Shell & Platform Foundation** estabelece a primeira presença física e visual do ExtensionTools no navegador Chromium. O Side Panel atua como a superfície principal de interação do usuário, devendo hospedar 12 ferramentas técnicas distintas ao longo da evolução do produto.

Diante do início do **Bloco 1 (Entrypoints WXT e Side Panel Shell)**, surgiram decisões cruciais sobre como estruturar a montagem da interface:
1. *Acoplamento de Entrypoint:* O entrypoint WXT (`src/entrypoints/sidepanel/main.tsx`) deve implementar a interface diretamente ou delegar a montagem para uma camada de aplicação desacoplada?
2. *Gerenciamento de Navegação e Estado Ativo:* Como o usuário alterna entre ferramentas sem que o container visual conheça o código interno de cada utilitário?
3. *Risco de Overengineering:* Deve-se introduzir uma arquitetura dinâmica de plugins assíncronos e stores globais pesadas antes da existência da primeira ferramenta real (Text Diff em M4)?

---

## 2. Decisão Adotada

Adotam-se as seguintes diretrizes arquiteturais para a composição da aplicação no Side Panel:

1. **Separação Rígida entre Entrypoint e Aplicação:**
   - O entrypoint WXT (`src/entrypoints/sidepanel/`) é estritamente técnico: inicializa o DOM (`index.html`), importa os estilos globais (`@tailwindcss/vite`), monta a raiz do React 19 (`createRoot`) e instancia o componente raiz da aplicação (`SidePanelApp`).
   - O entrypoint não contém regras visuais, lógicas de seleção ou estado de ferramentas.

2. **Composição Declarativa Desacoplada (Four-Layer Shell Composition):**
   A montagem da interface é orquestrada pelo componente de composição `SidePanelApp`, que integra três blocos funcionais com responsabilidades estritamente delimitadas:
   ```text
   src/entrypoints/sidepanel/main.tsx (Bootstrap WXT & React 19)
             │
             ▼
   src/app/sidepanel/SidePanelApp.tsx (Composição & Estado da Seleção)
             ├── ToolNavigation (src/features/tool-navigation/) ➔ Seletor de Destinos
             └── WorkspaceShell (src/features/workspace-shell/) ➔ Casca Estrutural
                       └── WorkspaceContent ➔ Monta a Feature Ativa ou Placeholder
   ```

3. **Fonte de Verdade Unívoca da Seleção (`activeToolId`):**
   - O estado da ferramenta atualmente selecionada reside no componente de composição (`SidePanelApp`).
   - A `ToolNavigation` atua como componente puro controlado: recebe a lista de ferramentas disponíveis e o `activeToolId`, disparando o evento `onSelectTool(id)`.
   - O `WorkspaceShell` atua como container de layout puro: recebe o cabeçalho, a barra de navegação e o conteúdo ativo via composição React (`children` / slots), sem conhecer a identidade ou os algoritmos das ferramentas.

4. **Proibição de Abstrações Prematuras no Bloco 1:**
   - Veta-se a introdução de frameworks de injeção de dependência, barramentos dinâmicos de eventos de UI ou arquitetura de plugins carregados em tempo de execução via strings.
   - A troca de ferramentas opera por seleção atômica determinística (renderização condicional ou mapa declarativo de componentes exportados pelas APIs públicas das features).

---

## 3. Justificativa Técnica

- **Aderência aos Limites do Boundary Linter (QG-02):** Mantém a direção de dependências unidirecional (`entrypoints` ➔ `app` ➔ `features` ➔ `shared`), impedindo que a casca visual importe submódulos internos das ferramentas.
- **Simplicidade Proporcional:** Permite testar o shell visual completo com mocks e placeholders antes de ter as ferramentas complexas implementadas em M4 e M5.
- **Preservação de Sessão Local-First:** Facilita a persistência da última ferramenta utilizada (`activeToolId`) diretamente em `chrome.storage.local` no nível de aplicação, sem poluir os módulos funcionais.

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Zero acoplamento entre a navegação e a lógica de processamento das ferramentas.
- O Workspace Shell pode ser reutilizado futuramente em abas dedicadas (`src/entrypoints/pages/`) mantendo a mesma experiência visual.
- Testes unitários do layout podem ser executados instantaneamente sem emulação de chamadas do WXT.

### Trade-offs e Riscos Mitigados
- *Re-renderização do container ao trocar de ferramenta:* Mitigado pelo isolamento de estado do React 19 e pelo fato de cada ferramenta manter seu estado de trabalho isolado localmente.

---

## 5. Referências e Evidências

- Especificação do Workspace Shell: [`docs/features/workspace-shell/README.md`](../../features/workspace-shell/README.md)
- Especificação da Tool Navigation: [`docs/features/tool-navigation/README.md`](../../features/tool-navigation/README.md)
- Plano de Execução do Bloco 1: [`docs/development/M3-PHASE-1-BLOCO-1.md`](../../development/M3-PHASE-1-BLOCO-1.md)
- Diretrizes de Design do Side Panel: [`DESIGN.md`](../../../DESIGN.md) (Seção 5, 6 e 7)
