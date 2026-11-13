import { z } from 'zod'

export const itemSchema = z.object({
  tipo: z.enum(['servico', 'peca']),
  nome: z.string().trim().min(1).max(160),
  valor: z.coerce.number().min(0).max(10_000_000).transform((v) => Math.round(v * 100) / 100),
  qtd: z.coerce.number().int().min(1).max(10_000).default(1),
})
export const itensSchema = z.array(itemSchema).max(200)

// Subconsulta que devolve os itens de uma linha pai como JSON ordenado.
export const itensJson = (tabela, fk, aliasPai) => `coalesce((
  select json_agg(json_build_object('id', i.id, 'tipo', i.tipo, 'nome', i.nome, 'valor', i.valor::float8, 'qtd', i.qtd) order by i.pos)
    from ${tabela} i where i.${fk} = ${aliasPai}.id), '[]'::json)`

export async function gravarItens(t, tabela, fk, paiId, itens) {
  await t.query(`delete from ${tabela} where ${fk} = $1`, [paiId])
  for (const [pos, it] of itens.entries()) {
    await t.query(
      `insert into ${tabela} (${fk}, pos, tipo, nome, valor, qtd) values ($1,$2,$3,$4,$5,$6)`,
      [paiId, pos, it.tipo, it.nome, it.valor, it.qtd])
  }
}
