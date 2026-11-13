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

## Sistema (SaaS)

O sistema real (cadastro, login, ordens, orçamentos) vive em **outro projeto**, isolado desta landing:
`liberty-mec-sistema` (front + API). Aqui fica só o site de apresentação e a demonstração com dados fictícios.

Para ligar os botões "Entrar" e "Começar grátis" ao sistema, defina `VITE_SISTEMA_URL` (endereço do front do sistema)
nas variáveis da Vercel. Sem ela, os botões levam à demonstração.
