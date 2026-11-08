# ADR-003 — Processamento Local-First e Privacidade Absoluta

> **Identificador:** `ADR-003`  
> **Título:** Adoção do Paradigma Local-First, Zero Backend Próprio e Privacidade Absoluta  
> **Status:** HOMOLOGADO E APROVADO  
> **Data da Decisão:** 05/11/2026 (Marco M1)  
> **Autoridade:** `Architect`  
> **Escopo:** Filosofia de produto, persistência e modelo de dados  

---

## 1. Contexto e Problema de Engenharia

Usuários técnicos e analistas manipulam dados sensíveis, como payloads JSON de APIs de produção, arquivos XML de faturamento, credenciais temporárias, notas de investigação técnica e trechos confidenciais de código. 

A maioria das ferramentas web online para essas tarefas (formatadores online de JSON, visualizadores de XML, comparadores de diff) exige que o usuário envie o conteúdo para servidores remotos de terceiros, gerando severos riscos de:
1. Violação de privacidade e conformidade regulatória (LGPD / GDPR).
2. Vazamento de informações sigilosas corporativas.
3. Dependência de conexão de rede para operações rotineiras de produtividade.

---

## 2. Decisão Adotada

O ExtensionTools é concebido integralmente sob o paradigma **Local-First**:
1. **Zero Servidores de Processamento:** A extensão não possui backend centralizado. 100% das operações de formatação, cálculo de diff, parsing de XML/JSON, validação sintática e exportação para PDF ocorrem em memória na workstation do usuário através do runtime do navegador.
2. **Persistência Exclusivamente Local:** Todas as preferências de configuração, histórico de sessões e dados de investigações estruturadas são gravados localmente em mecanismos seguros da sandbox da extensão:
   - `chrome.storage.local`: Para preferências, metadados rápidos e estados de workspace.
   - `IndexedDB`: Para payloads estruturados de grande volume e entidades relacionais de investigações.
3. **Comunicação Externa Opcional e Sob Demanda:** Conexões remotas são estritamente restritas a integrações deliberadamente autorizadas pelo usuário (e.g. sincronização de calendário com provedor externo), jamais ocorrendo de forma silenciosa ou automática.
4. **Zero Telemetria Invasiva:** É proibida a inclusão de SDKs de monitoramento, analytics terceiros ou rastreadores de atividade.

---

## 3. Justificativa Técnica e de Segurança

- **Conformidade Regulatória por Desenho (Privacy by Design):** Ao não transmitir dados para fora da máquina local, elimina-se a superfície de ataque remota e cumprem-se os requisitos mais estritos de segurança corporativa.
- **Velocidade Instantânea:** Cálculos locais em funções puras executam em milissegundos sem latência de rede.
- **Operação Offline Plena:** A extensão permanece 100% funcional sem conexão com a internet.

---

## 4. Consequências e Trade-offs

### Consequências Positivas
- Confiança plena do usuário ao manipular dados técnicos confidenciais.
- Custo zero de infraestrutura de servidores para o projeto.
- Menor privilégio no Manifest V3: permissões como `<all_urls>` tornam-se desnecessárias.

### Trade-offs e Riscos Mitigados
- *Limitações de armazenamento local:* Mitigado pelo uso planejado da File System Access API para permitir que o usuário salve ou exporte arquivos diretamente para o sistema de arquivos local sob confirmação explícita.
- *Responsabilidade do usuário por backups:* Mitigado pela inclusão futura de rotinas locais de importação e exportação de dados em formatos abertos (JSON/ZIP).

---

## 5. Referências e Evidências

- Visão do Produto: [`docs/product/PRODUCT-OVERVIEW.md`](../../product/PRODUCT-OVERVIEW.md) (Seção 1.1)
- Arquitetura Canônica: [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) (Seção 1.1 e 6)
- Política Pública de Segurança: [`SECURITY.md`](../../../SECURITY.md)
