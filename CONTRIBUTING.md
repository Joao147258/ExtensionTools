# Guia de Contribuição — ExtensionTools

> **Classificação:** Repositório Público  
> **Governança:** [`AGENTS.md`](AGENTS.md) | [`GEMINI.md`](GEMINI.md) | [`SECURITY.md`](SECURITY.md)

---

## 1. Princípios Gerais de Contribuição

O desenvolvimento do **ExtensionTools** segue contratos rígidos de engenharia, qualidade de código e segurança. Seja você um desenvolvedor humano ou um agente de inteligência artificial, as seguintes diretrizes são mandatórias:

1. **Segurança em Primeiro Lugar**: Leia e cumpra integralmente a política de [`SECURITY.md`](SECURITY.md). Nenhum segredo, caminho privado ou dado confidencial pode ingressar no repositório.
2. **Dados Sintéticos Exclusivos**: Todos os testes, fixtures, exemplos e documentações devem utilizar dados fictícios (`example.com`, `SampleUser`, etc.).
3. **Respeito à Arquitetura Modular**: As ferramentas do produto residem em `src/features/` com limites bem definidos. Dependências circulares e acoplamento desnecessário são proibidos.
4. **Local-First & Princípio do Menor Privilégio**: Não introduza integrações de nuvem obrigatórias ou permissões excessivas no Manifest V3 da extensão.

---

## 2. Ativação dos Hooks de Segurança do Git

Para garantir que nenhum arquivo sensível ou proibido seja submetido ao repositório local ou remoto, ative os hooks versionados em `.githooks/`:

```bash
git config core.hooksPath .githooks
```

Os hooks inspecionarão automaticamente os arquivos antes de `git commit` (pre-commit) e antes de `git push` (pre-push).

---

## 3. Comandos de Verificação e Qualidade

Antes de submeter alterações:

1. **Auditoria de Segurança Local**:
   ```bash
   pnpm run test:security      # Executa a suíte de testes dos scanners
   pnpm run security:guard     # Executa o Repository Publication Guard
   ```
2. **Compilação Estática**:
   ```bash
   pnpm run compile
   ```
3. **Linting e Formatação**:
   ```bash
   pnpm run lint
   pnpm run format:check
   ```

---

## 4. Governança de Agentes de IA

Para agentes autônomos ou assistentes de IA operando no workspace:
- Consulte a hierarquia de instruções em [`AGENTS.md`](AGENTS.md) e [`GEMINI.md`](GEMINI.md).
- Respeite as atribuições dos 9 agentes canônicos definidos em `.harness/agents/`.
- Nunca crie arquivos com informações reais fornecidas durante diálogos com o usuário.
- Sempre relate explicitamente: o que foi planejado, o que foi implementado, o que foi testado mecanicamente e quais pendências restam.
- Não realize commits, pushs ou tags Git de forma autônoma sem autorização humana formal.
