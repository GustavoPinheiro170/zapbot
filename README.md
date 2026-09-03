# ZapFlow — robô de atendimento no WhatsApp

Monorepo do produto: um SaaS para montar assistentes de IA que atendem clientes pelo
WhatsApp (proposta equivalente à do BotConversa). Este README documenta a estrutura
funcional do projeto — não é a landing page (essa está em [`design/`](design), publicada
como Artifact).

## A proposta do robô

O robô não é um simples "responde e pronto": ele executa um **fluxo** — um grafo de nós
que decide o que fazer a cada mensagem do cliente. Um fluxo pode:

- mandar uma mensagem (`message`);
- fazer uma pergunta e guardar a resposta do cliente numa variável (`collect`);
- decidir o próximo passo com base numa variável (`condition`);
- mover a conversa para um estágio do CRM Kanban (`setStage`);
- pedir uma resposta gerada por IA (`aiReply`);
- transferir para um atendente humano (`handoff`) ou encerrar (`end`).

Isso é o `@whatsbot/flow-engine` — o "cérebro" do robô, testado de forma isolada, sem
nenhuma dependência de WhatsApp, HTTP ou banco de dados.

## Arquitetura

```
whatsbot/
├── design/                     landing page (Claude Design canvas, já publicada)
├── packages/
│   ├── flow-engine/            motor de fluxos — lógica pura, 100% testada (TDD)
│   └── whatsapp-adapter/       integração com a Meta Cloud API + parser de webhook + mock
├── apps/
│   ├── api/                    backend Fastify: webhook, fluxos, conversas/CRM
│   └── web/                    painel React + Tailwind (dashboard, fluxos, Kanban)
```

Fluxo de uma mensagem recebida:

```
WhatsApp → webhook (Meta) → parseIncomingWebhook → ConversationSession
                                                          │
                                                          ├─ flow-engine.step(...)
                                                          │      → decide as próximas ações
                                                          │
                                                          ├─ WhatsAppAdapter.sendText(...)
                                                          └─ AiResponder.reply(...) (nó aiReply)
```

`WhatsAppAdapter` e `AiResponder` são interfaces. A API real (`MetaCloudAdapter`) só é
usada se houver credenciais no `.env`; sem elas, a API sobe com um `MockAdapter` em
memória — dá pra desenvolver e testar o robô inteiro sem conta de WhatsApp Business.

## Stack e por quê

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Motor do robô | TypeScript puro | lógica de domínio não deveria depender de framework nenhum — fica testável em milissegundos |
| WhatsApp | Meta Cloud API (oficial) | decisão do produto: estabilidade e conformidade para um SaaS comercial, sem risco de banimento |
| Backend | Fastify + TypeScript | leve, rápido, ótimo suporte a testes via `app.inject()` (sem precisar subir servidor de verdade nos testes) |
| Persistência de fluxos | MongoDB, via Docker | não-relacional por escolha do produto; cada fluxo é um documento na coleção `flows`, isolado por `userId` — ver "Fluxos por usuário" abaixo |
| Persistência de conversas/settings | Repositórios em memória | ainda não pedido; a interface (`ConversationRepository`) já isola a troca depois, igual foi feito para fluxos |
| Frontend | React + Vite + Tailwind | rapidez de iteração de UI e reaproveita a identidade visual (Sora/Manrope, azul/verde) já definida na landing page |
| Testes | Vitest em todo o monorepo (+ Testing Library no frontend) | um único runner, rápido, com suporte nativo a TS/ESM/JSX |

## Fluxos por usuário

Os fluxos ficam em uma coleção `flows` no MongoDB, um documento por fluxo, com um campo
`userId`. Não existe login ainda, então toda requisição roda hoje sob um único
`DEFAULT_USER_ID` constante (`apps/api/src/domain/defaultUser.ts`) — mas o repositório e
as rotas já leem o cabeçalho `x-user-id` quando ele existe, então plugar autenticação de
verdade depois é só passar esse header a partir de quem estiver logado, sem mexer em
schema nem em repositório.

`FlowRepository` é uma interface com duas implementações: `InMemoryFlowRepository` (usada
nos testes — rápida, sem precisar do Docker rodando) e `MongoFlowRepository` (usada pela
API de verdade). `MongoFlowRepository` não tem teste automatizado no `npm test` — foi
verificada manualmente contra o container real (criar fluxo, reiniciar a API, confirmar
que sobreviveu).

## Como rodar

```bash
npm install

# Suba o MongoDB (uma vez só — fica rodando em segundo plano)
docker compose up -d

# Terminal 1 — API (sobe em http://localhost:3333)
npm run dev:api

# Terminal 2 — painel (sobe em http://localhost:5173)
npm run dev:web
```

Sem configurar nada, a API já funciona com o `MockAdapter`: você pode simular uma
mensagem recebida direto via curl e ver o robô responder (fica registrado em
`GET /conversations`, visível no Kanban do painel):

```bash
curl -X POST http://localhost:3333/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{ "id": "WABA", "changes": [{ "field": "messages", "value": {
      "messaging_product": "whatsapp",
      "metadata": { "display_phone_number": "1", "phone_number_id": "1" },
      "contacts": [{ "profile": { "name": "Maria" }, "wa_id": "5511999998888" }],
      "messages": [{ "from": "5511999998888", "id": "wamid.1", "timestamp": "1", "type": "text", "text": { "body": "Oi" } }]
    } }] }]
  }'
```

### Conectar ao WhatsApp de verdade

Duas formas, sem precisar reiniciar a API:

1. **Pelo painel** (recomendado): `http://localhost:5173/settings` — cole o Access Token e
   o Phone Number ID da [Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api),
   defina um Verify Token e clique em "Testar conexão" para confirmar contra a API real da
   Meta antes de usar. Some o botão "Salvar" quando quiser trocar de credencial depois — o
   robô passa a mandar mensagens reais no próximo envio.
2. **Por variável de ambiente**: copie `apps/api/.env.example` para `apps/api/.env` e
   preencha `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID` e `META_VERIFY_TOKEN`. Serve como
   valor inicial — o painel pode sobrescrever depois. **Nunca** cole valores reais em
   `.env.example` (não é ignorado pelo git); use sempre `.env` (que já está no `.gitignore`).

Sem nenhuma das duas, a API roda normalmente com o `MockAdapter` em memória (modo de
simulação) — o robô responde e move o Kanban normalmente, só não manda mensagem real.

## Deploy (para testar o webhook em produção)

O painel (`apps/web`) é uma SPA estática — encaixe perfeito pra Vercel. A API
(`apps/api`) é um servidor Fastify de processo contínuo com estado em memória
(conversas, configurações) — **não roda em serverless sem reescrever essa parte**, então
vai para a Render (processo contínuo, como já roda localmente; camada gratuita disponível
para esse tipo de serviço). O Mongo local (Docker) não é alcançável pela nuvem, então a API
de produção usa o MongoDB Atlas.

`render.yaml` (raiz) e `apps/web/vercel.json` já estão prontos — falta só conectar as
contas, o que só você pode fazer (login/criação de conta não são algo que eu consiga fazer
por você). Há também um `railway.json` no repositório, caso você volte a usar a Railway
num plano pago no futuro — mas o guia abaixo segue pela Render.

### 1. GitHub
```bash
gh repo create whatsbot --private --source=. --push
# ou, sem a CLI do GitHub: crie um repo vazio no site e depois
git remote add origin <url-do-repo>
git push -u origin master
```

### 2. MongoDB Atlas
Crie um cluster gratuito (M0) em [mongodb.com/atlas](https://www.mongodb.com/atlas) →
Database Access (crie um usuário) → Network Access (libere `0.0.0.0/0` pra simplificar) →
copie a *connection string* (`mongodb+srv://...`) e acrescente o nome do banco no final:
`.../whatsbot?retryWrites=true&w=majority`.

### 3. Render (API)
[render.com](https://render.com) → **New** → **Blueprint** → conecte o repositório — o
Render lê o `render.yaml` da raiz automaticamente e já propõe o serviço `whatsbot-api`
configurado. Ele vai pedir pra preencher as variáveis marcadas como secretas:

```
MONGODB_URI=<connection string do Atlas>
META_VERIFY_TOKEN=<uma palavra-chave sua>
META_ACCESS_TOKEN=<opcional — dá pra configurar depois pelo painel>
META_PHONE_NUMBER_ID=<opcional — idem>
WEB_ORIGIN=<preenche depois do passo 4, com a URL da Vercel>
```

Depois do deploy, copie a URL pública que a Render gera (algo como
`https://whatsbot-api.onrender.com`) — é o domínio do seu webhook:
`https://whatsbot-api.onrender.com/webhook/whatsapp`.

> No plano gratuito, o serviço "dorme" depois de ~15 min sem receber requisição e leva
> alguns segundos pra acordar na próxima — tranquilo para testar, só não espere resposta
> instantânea se ele estiver frio.

### 4. Vercel (painel)
Novo projeto → importe o mesmo repositório → **Root Directory: `apps/web`** (a Vercel
detecta o `vercel.json` de lá). Em Environment Variables:

```
VITE_API_URL=<URL da Render, sem barra no final>
```

### 5. Fechar o ciclo
- Volte na Render e preencha `WEB_ORIGIN` com a URL que a Vercel gerou (restringe o CORS).
- No painel da Meta (WhatsApp → Configuration → Webhook), cadastre a Callback URL da
  Render (`.../webhook/whatsapp`) e o mesmo `META_VERIFY_TOKEN`.
- A partir daqui, todo `git push` pra `master` aciona automaticamente: o CI do GitHub
  Actions (`.github/workflows/ci.yml` — type-check, testes, build) e, em paralelo, os
  deploys da Vercel e da Render (cada uma com sua própria integração nativa do GitHub —
  não precisa de passo manual de deploy no workflow). Nada é publicado se o build falhar.

## Testes e a arquitetura TDD

```bash
npm test          # roda a suíte inteira (todos os pacotes e apps)
npm run test:watch
```

Todo o motor do robô, o adapter do WhatsApp e as rotas da API foram construídos no ciclo
red → green: o teste foi escrito e executado (falhando, porque o código ainda não
existia) antes de qualquer implementação. Exemplo (`packages/flow-engine`):

1. `tests/engine.test.ts` descreve o comportamento esperado (11 casos: mensagens em
   cadeia, pausa em `collect`, ramificação por `condition`, `setStage`, `aiReply`,
   `handoff`, `end`, proteção contra fluxo cíclico, referência a nó inexistente...).
2. Rodar os testes nesse ponto falha — não existe `src/engine.ts`.
3. `engine.ts` é implementado até os 11 testes passarem.

O mesmo padrão vale para `whatsapp-adapter` (parser do webhook da Meta + cliente HTTP,
com `fetch` injetado — nenhum teste bate na API real) e para as rotas do Fastify
(`app.inject()`, sem subir servidor). No frontend, `KanbanBoard` segue o mesmo ciclo com
Testing Library.

Estado atual: **80 testes, todos passando**, cobrindo motor de fluxos, adapter do
WhatsApp, API e frontend.

## O que é real e o que é esqueleto (para o próximo passo)

- ✅ Real: motor de fluxos, parser de webhook da Meta, cliente HTTP da Meta Cloud API,
  rotas da API, orquestração conversa → ações, painel React consumindo a API de verdade.
- 🧪 Simplificado de propósito:
  - **Persistência em memória** — reinicia ao reiniciar a API. Trocar por Postgres
    (Prisma ou Drizzle) é uma mudança isolada nos dois repositórios em
    `apps/api/src/repositories/`, sem tocar no motor de fluxos nem nas rotas.
  - **`EchoAiResponder`** — resposta de IA simulada (mesma interface `AiResponder`); para
    ligar um provedor real (ex. API da Anthropic), basta criar uma nova implementação da
    interface e trocar no `apps/api/src/index.ts`.
- ✅ Real também: editor visual de fluxos em canvas (`apps/web/src/pages/FlowEditor.tsx`,
  com [`@xyflow/react`](https://reactflow.dev)) — nós arrastáveis, conexões feitas
  arrastando de um ponto de saída a outro nó (define `next`/`whenTrue`/`whenFalse`),
  painel lateral para editar o conteúdo de cada nó, layout automático em colunas para nós
  recém-criados e salvamento automático (debounced) a cada alteração.
