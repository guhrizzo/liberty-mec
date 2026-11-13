# Liberty Mec

Landing page e demonstração interativa de um SaaS de gestão para oficina mecânica
(ordens de serviço, orçamentos, agenda e financeiro). Produto fictício de demonstração.

Feito por Rizzo Web.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build para hospedagem

```bash
npm run build
```

Gera a pasta `dist/` (site estático). Em Vercel, Netlify ou Cloudflare Pages use:

- Build command: `npm run build`
- Output directory: `dist`

## API (pasta `server/`)

Node + Express + Postgres. Login com JWT, senha com bcrypt e isolamento por oficina (toda consulta filtra por `oficina_id`).

```bash
cd server
npm install
npm run dev     # http://localhost:3001 (sem DATABASE_URL usa um Postgres embutido em ./.data)
npm test        # testes de ponta a ponta, incluindo isolamento entre oficinas
```

Rotas (todas, exceto `/auth/*` e `/saude`, exigem `Authorization: Bearer <token>`):

| Rota | O que faz |
| --- | --- |
| `POST /auth/cadastro`, `POST /auth/login`, `GET /auth/eu` | Cria a oficina + dono (7 dias de teste), entra e consulta a sessão |
| `/clientes`, `/veiculos` | Listar, criar, editar e remover |
| `/ordens` | Listar, criar (numeração sequencial), editar, `PATCH /:id/status` |
| `/orcamentos` | Listar, criar, `POST /:id/aprovar` (gera a OS) e `/:id/recusar` |

### Deploy na Render

1. Em **New + → Blueprint**, aponte para este repositório. O `render.yaml` cria a API e o Postgres.
2. Confira `CORS_ORIGIN` (endereço do site na Vercel). `JWT_SECRET` é gerado pela Render.
3. No site, aponte o front para a URL da API (`VITE_API_URL`).

### Ligando o site à API

- **Local:** rode a API (`cd server && npm run dev`, porta 3001) e o site (`npm run dev`). Em desenvolvimento o site já aponta para `http://localhost:3001`.
- **Produção (Vercel):** defina a variável `VITE_API_URL` com o endereço da API na Render e faça um novo deploy. O `vercel.json` já cuida das rotas `/entrar`, `/cadastrar` e `/app`.
- Telas: `/cadastrar` (teste de 7 dias), `/entrar` e `/app` (o sistema, só para quem está logado).
