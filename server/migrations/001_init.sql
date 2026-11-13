-- Liberty Mec: esquema inicial (multi-oficina). Toda tabela de negócio carrega oficina_id.

create table oficinas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  plano      text not null default 'essencial' check (plano in ('essencial', 'completo')),
  trial_ate  date not null default (current_date + 7),
  prox_os    int  not null default 1,
  prox_orc   int  not null default 1,
  criado_em  timestamptz not null default now()
);

create table usuarios (
  id          uuid primary key default gen_random_uuid(),
  oficina_id  uuid not null references oficinas(id) on delete cascade,
  nome        text not null,
  email       text not null,
  senha_hash  text not null,
  papel       text not null default 'dono' check (papel in ('dono', 'equipe')),
  criado_em   timestamptz not null default now()
);
create unique index usuarios_email_uq on usuarios (lower(email));
create index usuarios_oficina_idx on usuarios (oficina_id);

create table clientes (
  id          uuid primary key default gen_random_uuid(),
  oficina_id  uuid not null references oficinas(id) on delete cascade,
  nome        text not null,
  telefone    text not null default '',
  email       text not null default '',
  cidade      text not null default '',
  criado_em   timestamptz not null default now()
);
create index clientes_oficina_idx on clientes (oficina_id, nome);

create table veiculos (
  id          uuid primary key default gen_random_uuid(),
  oficina_id  uuid not null references oficinas(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete restrict,
  placa       text not null,
  modelo      text not null,
  ano         int,
  km          int,
  cor         text not null default '',
  criado_em   timestamptz not null default now()
);
create index veiculos_oficina_idx on veiculos (oficina_id, placa);
create index veiculos_cliente_idx on veiculos (cliente_id);

create table ordens (
  id          uuid primary key default gen_random_uuid(),
  oficina_id  uuid not null references oficinas(id) on delete cascade,
  numero      int  not null,
  veiculo_id  uuid not null references veiculos(id) on delete restrict,
  relato      text not null default '',
  status      text not null default 'avaliacao'
              check (status in ('avaliacao', 'aprovacao', 'execucao', 'pronto', 'entregue')),
  entrada     date not null default current_date,
  previsao    date,
  mecanico    text not null default '',
  criado_em   timestamptz not null default now(),
  unique (oficina_id, numero)
);
create index ordens_oficina_idx on ordens (oficina_id, status);
create index ordens_veiculo_idx on ordens (veiculo_id);

create table os_itens (
  id        uuid primary key default gen_random_uuid(),
  ordem_id  uuid not null references ordens(id) on delete cascade,
  pos       int  not null default 0,
  tipo      text not null check (tipo in ('servico', 'peca')),
  nome      text not null,
  valor     numeric(12, 2) not null check (valor >= 0),
  qtd       int  not null default 1 check (qtd > 0)
);
create index os_itens_ordem_idx on os_itens (ordem_id);

create table orcamentos (
  id          uuid primary key default gen_random_uuid(),
  oficina_id  uuid not null references oficinas(id) on delete cascade,
  numero      int  not null,
  veiculo_id  uuid not null references veiculos(id) on delete restrict,
  validade    date,
  status      text not null default 'enviado'
              check (status in ('rascunho', 'enviado', 'aprovado', 'recusado')),
  obs         text not null default '',
  ordem_id    uuid references ordens(id) on delete set null,
  criado_em   timestamptz not null default now(),
  unique (oficina_id, numero)
);
create index orcamentos_oficina_idx on orcamentos (oficina_id, status);

create table orcamento_itens (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid not null references orcamentos(id) on delete cascade,
  pos           int  not null default 0,
  tipo          text not null check (tipo in ('servico', 'peca')),
  nome          text not null,
  valor         numeric(12, 2) not null check (valor >= 0),
  qtd           int  not null default 1 check (qtd > 0)
);
create index orcamento_itens_idx on orcamento_itens (orcamento_id);
