# ADR-006 — Arquitetura de Mensageria da Plataforma: Inversão de Dependências, Validação em Runtime e Isolamento de Contextos

> **Identificador:** `ADR-006`  
> **Título:** Arquitetura de Mensageria da Plataforma (Platform Messaging): Inversão de Dependências, Validação em Runtime e Isolamento de Contextos no Manifest V3  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 08/11/2026 (Marco M3 / Bloco 3)  
> **Autoridade:** `Architect`  
> **Escopo:** `src/platform/messaging/`, `src/entrypoints/background/`, `src/app/sidepanel/services/`  

---

## 1. Contexto e Problema de Engenharia

O marco **M3 — Product Shell & Platform Foundation** estabelece as fundações transversais de plataforma do ExtensionTools. Sob a arquitetura **Manifest V3**, uma extensão de navegador opera com múltiplos contextos de execução isolados em processos e memórias distintos:

1. **Side Panel (`src/entrypoints/sidepanel/`):** Contexto visual de longa duração executando React 19 no processo de renderização da barra lateral do Chromium.
2. **Background Service Worker (`src/entrypoints/background/`):** Contexto de segundo plano sem interface gráfica, governado por ciclo de vida efêmero (*event-driven*), sendo encerrado pelo Chromium após períodos de inatividade e reiniciado sob demanda diante de eventos externos ou mensagens IPC.
3. **Content Scripts (`src/entrypoints/content/`):** Scripts injetados em abas web externas autorizadas, executando em *isolated worlds*.

Diante da necessidade de comunicação entre a interface do usuário e o Service Worker de segundo plano (para operações de plataforma, persistência, diagnósticos e controle de abas), surgiram os seguintes desafios estruturais:

- **Acoplamento Tecnológico Prematuro:** O consumo direto de `browser.runtime.sendMessage` por componentes React ou serviços de aplicação inviabilizaria testes unitários rápidos e determinísticos com Vitest, forçando emulação pesada do navegador.
- **Fronteira de Confiança Não Confiável:** Dados trafegados via IPC (`chrome.runtime.onMessage`) chegam ao Background e retornam ao Side Panel como `unknown`. Confiar exclusivamente na tipagem estática do TypeScript em tempo de compilação cria um risco grave de quebras silenciosas (*runtime type drift*) e vulnerabilidades a payloads malformados ou adulterados.
- **Ciclo de Vida Efêmero do Service Worker:** Roteadores de mensagem que mantêm estado mutável na memória global falham silenciosamente quando o Service Worker é reiniciado pelo Chromium.
- **Segurança de Origem e Autorização:** Mensagens recebidas em `onMessage` podem se originar do próprio Side Panel, de extensões externas (se permitido) ou de Content Scripts injetados em páginas da web. Handlers privilegiados de plataforma não podem ser executados sem autenticação estrita do remetente.

---

## 2. Decisões Adotadas

Adotam-se as seguintes diretrizes arquiteturais para o barramento de mensageria da plataforma (`src/platform/messaging/`):

### 2.1. Inversão de Dependências (DIP) e Arquitetura Ports and Adapters
- Define-se a interface de porta de saída [`MessageTransport`](../../../src/platform/messaging/transport.ts):
  ```typescript
  export interface MessageTransport {
    send(request: AnyRequest): Promise<unknown>;
  }
  ```
- O cliente de mensageria de alto nível ([`MessagingClient`](../../../src/platform/messaging/messaging-client.ts)) depende exclusivamente dessa abstração, sendo agnóstico em relação às APIs do navegador.
- A integração concreta com o Chromium é delegada ao adaptador [`BrowserRuntimeTransport`](../../../src/platform/messaging/browser-runtime-transport.ts), que encapsula `browser.runtime.sendMessage()`.
- Em testes unitários e de integração, o transporte concreto é substituído por implementações em memória (*in-memory loopback* ou mocks), permitindo testes instantâneos sem overhead de browser.

### 2.2. Separação Rigorosa entre Tipagem Estática e Runtime Validation
- **Em tempo de compilação (`contracts.ts`):** O protocolo é formalmente discriminado pela propriedade `type`, associando cada `MessageType` ao seu `RequestData<K>` e `ResponseData<K>`.
- **Em tempo de execução (`validation.ts`):** Todas as mensagens que cruzam a fronteira do processo são inspecionadas por Type Guards funcionais puros ([`isRecord`](../../../src/platform/messaging/validation.ts#L10), [`isProtocolMessage`](../../../src/platform/messaging/validation.ts#L30), [`isRequestMessage`](../../../src/platform/messaging/validation.ts#L65), [`isReplyFor`](../../../src/platform/messaging/validation.ts#L80)).
- O validador rejeita objetos maliciosos, protótipos modificados, strings de tamanho excessivo (> 128 caracteres para IDs) e payloads com propriedades de protocolo sobrepostas.

### 2.3. Desacoplamento entre Roteamento, Execução e Listener Tecnológico
- **`BackgroundRouter` (`background-router.ts`):** Componente funcional puro, **sem nenhum import de APIs do navegador**. Recebe a mensagem e a estrutura confiável [`SenderInfo`](../../../src/platform/messaging/background-router.ts#L10), aplica autorização, valida a solicitação, despacha para o handler registrado e devolve um [`MessageReply<K>`](../../../src/platform/messaging/contracts.ts#L45).
- **`BackgroundListener` (`register-background-messaging.ts`):** Adaptador de entrada tecnológico conectado a `browser.runtime.onMessage.addListener`. Retorna síncronamente `true` para sinalizar ao navegador que a resposta será entregue assincronamente via `sendResponse`.
- **Composition Root (`src/entrypoints/background/index.ts`):** Registra handlers e listeners durante a carga inicial síncrona do Service Worker, garantindo prontidão imediata do Manifest V3.

### 2.4. Comunicação Pontual (One-Off Request-Response) sem Retry Automático
- O transporte adota o modelo atômico de solicitação e resposta via `runtime.sendMessage()`. Veta-se o uso de portas de longa duração (`runtime.connect()`) ou streaming contínuo nesta fase.
- O [`MessagingClient`](../../../src/platform/messaging/messaging-client.ts) implementa uma **barreira local de timeout** configurável via `Promise.race()`.
- **Ausência deliberada de retry automático:** Para prevenir mutações acidentais duplicadas e manter a previsibilidade funcional, o cliente não realiza retentativas automáticas.
- **Ressalva semântica do timeout:** O timeout limita o tempo de espera do cliente local; ele **não garante o cancelamento da operação no Background**, que pode já ter sido iniciada.

### 2.5. Autorização Estrita e Segurança Fail-Safe
- Todo despacho no `BackgroundRouter` avalia a procedência da mensagem via `SenderInfo`:
  ```typescript
  if (sender.id !== extensionId) return unauthorizedReply;
  if (sender.tab != null) return unauthorizedReply; // Bloqueia Content Scripts de chamar platform.*
  ```
- Exceções internas e rejeições assíncronas lançadas por handlers são capturadas e convertidas no código seguro `HANDLER_FAILED`, com mensagem opaca do catálogo canônico [`PUBLIC_ERROR_MESSAGES`](../../../src/platform/messaging/errors.ts#L15), impedindo o vazamento de stack traces ou detalhes do sistema de arquivos.

---

## 3. Justificativa Técnica

- **Aderência aos Limites do Boundary Linter (QG-02):** A porta `MessageTransport` permite que serviços do Side Panel se comuniquem com o Background sem que a interface importe módulos de entrypoints ou background.
- **Conformidade com o Ciclo de Vida do Manifest V3:** O roteador é totalmente *stateless*. Toda requisição traz seu contexto e identificador de correlação (`id`), garantindo resiliência total a suspensões e reinicializações do Service Worker.
- **Testabilidade Determinística:** 100% da lógica de protocolo, cliente e roteamento é testável no Vitest em milissegundos sem necessidade de lançar o Chromium.

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Tipagem fim a fim estrita com inferência automática de payload e resposta por tipo de operação.
- Proteção robusta contra mensagens maliciosas provenientes de páginas web ou extensões terceiras.
- Tratamento de erro padronizado retornando [`MessageResult<T>`](../../../src/platform/messaging/contracts.ts#L58) no padrão Result / Either.
- Fácil extensibilidade: adicionar uma nova operação requer apenas tipar em `contracts.ts`, validar em `validation.ts` e registrar o handler no Background.

### Trade-offs e Riscos Mitigados
- *Duplicação aparente entre tipos e validadores:* Mitigada pela garantia de segurança em tempo de execução indispensável em ambientes de extensão Web.
- *Falta de cancelamento remoto de timeout:* Mitigada pelo caráter pontual e rápido das operações de plataforma (e.g. `platform.ping` executa em < 1 ms).

---

## 5. Rastreabilidade e Evidências

- **Especificação Canônica:** `.local/docs/Blocos/M3/B3-F01_F05.MD` e `.local/docs/Blocos/M3/B3-F06_F10.MD`
- **Guia de Revisão e Auditoria:** `.local/docs/Blocos/M3/Testes_&_Review.MD`
- **Relatório de Revisão Final:** [`docs/Relatorios/m3/Bloco_3/RELATORIO-REVISAO-FINAL-BLOCO-3.md`](../Relatorios/m3/Bloco_3/RELATORIO-REVISAO-FINAL-BLOCO-3.md)
- **Implementação do Módulo:** [`src/platform/messaging/`](../../../src/platform/messaging/)
- **Suítes de Teste Automatizadas:** 69 testes unitários e de integração cobrindo o subsistema de mensageria com 100% de aprovação.
