// Dados fictícios da demonstração. Tudo vive só em memória: recarregar a página restaura este estado.

export const iso = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const brl = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dataCurta = (s) => {
  if (!s) return '—'
  const [, m, d] = s.split('-')
  return `${d}/${m}`
}

export const STATUS = [
  { id: 'avaliacao', label: 'Em avaliação', tone: 'blue' },
  { id: 'aprovacao', label: 'Aguardando aprovação', tone: 'amber' },
  { id: 'execucao', label: 'Em execução', tone: 'violet' },
  { id: 'pronto', label: 'Pronto p/ retirada', tone: 'green' },
  { id: 'entregue', label: 'Entregue', tone: 'grey' },
]
export const statusOf = (id) => STATUS.find((s) => s.id === id)

export const CATALOGO = [
  { id: 's1', tipo: 'servico', nome: 'Troca de óleo e filtro', valor: 90 },
  { id: 's2', tipo: 'servico', nome: 'Alinhamento e balanceamento', valor: 140 },
  { id: 's3', tipo: 'servico', nome: 'Troca de pastilhas (eixo)', valor: 160 },
  { id: 's4', tipo: 'servico', nome: 'Revisão completa', valor: 380 },
  { id: 's5', tipo: 'servico', nome: 'Diagnóstico com scanner', valor: 120 },
  { id: 's6', tipo: 'servico', nome: 'Troca de correia dentada', valor: 420 },
  { id: 'p1', tipo: 'peca', nome: 'Óleo 5W30 sintético (4 L)', valor: 215 },
  { id: 'p2', tipo: 'peca', nome: 'Filtro de óleo', valor: 38 },
  { id: 'p3', tipo: 'peca', nome: 'Jogo de pastilhas dianteiras', valor: 189 },
  { id: 'p4', tipo: 'peca', nome: 'Kit correia dentada + tensor', valor: 540 },
  { id: 'p5', tipo: 'peca', nome: 'Filtro de ar', valor: 54 },
  { id: 'p6', tipo: 'peca', nome: 'Vela de ignição (jogo)', valor: 148 },
]

export const clientesIniciais = [
  { id: 'c1', nome: 'Marcos Antônio Vieira', telefone: '(11) 98812-4410', email: 'marcos.vieira@email.com', cidade: 'Guarulhos', desde: '2023-03-14' },
  { id: 'c2', nome: 'Patrícia Nogueira', telefone: '(11) 97733-0921', email: 'patricia.nog@email.com', cidade: 'São Paulo', desde: '2024-01-08' },
  { id: 'c3', nome: 'Transportes Ribeiro Ltda.', telefone: '(11) 4002-8812', email: 'frota@ribeirotransp.com.br', cidade: 'Osasco', desde: '2022-09-30' },
  { id: 'c4', nome: 'Jorge Luiz Teixeira', telefone: '(11) 99120-3377', email: 'jorgeteixeira@email.com', cidade: 'São Paulo', desde: '2024-06-21' },
  { id: 'c5', nome: 'Camila Fernandes', telefone: '(11) 96655-7090', email: 'camila.f@email.com', cidade: 'Barueri', desde: '2025-02-03' },
  { id: 'c6', nome: 'Auto Peças Dois Irmãos', telefone: '(11) 3456-1209', email: 'contato@doisirmaos.com.br', cidade: 'São Paulo', desde: '2021-11-17' },
  { id: 'c7', nome: 'Renato Salgado', telefone: '(11) 98450-2218', email: 'renato.salgado@email.com', cidade: 'Guarulhos', desde: '2025-08-12' },
]

export const veiculosIniciais = [
  { id: 'v1', clienteId: 'c1', placa: 'QWE-4F21', modelo: 'Volkswagen Gol 1.6', ano: 2018, km: 84200, cor: 'Prata' },
  { id: 'v2', clienteId: 'c2', placa: 'RJK-7B93', modelo: 'Honda HR-V EXL', ano: 2021, km: 41300, cor: 'Branco' },
  { id: 'v3', clienteId: 'c3', placa: 'FTR-2D08', modelo: 'Fiat Ducato Cargo', ano: 2019, km: 168900, cor: 'Branco' },
  { id: 'v4', clienteId: 'c3', placa: 'GHA-9C44', modelo: 'Renault Master', ano: 2017, km: 212400, cor: 'Branco' },
  { id: 'v5', clienteId: 'c4', placa: 'PLM-1A55', modelo: 'Toyota Corolla XEi', ano: 2020, km: 63700, cor: 'Preto' },
  { id: 'v6', clienteId: 'c5', placa: 'SDA-8E17', modelo: 'Hyundai HB20 Comfort', ano: 2022, km: 28900, cor: 'Vermelho' },
  { id: 'v7', clienteId: 'c6', placa: 'BRX-3H62', modelo: 'Fiat Strada Endurance', ano: 2020, km: 97800, cor: 'Cinza' },
  { id: 'v8', clienteId: 'c7', placa: 'TUV-6J30', modelo: 'Chevrolet Onix LT', ano: 2019, km: 72100, cor: 'Azul' },
  { id: 'v9', clienteId: 'c1', placa: 'KLM-5G88', modelo: 'Ford Ka SE', ano: 2016, km: 119400, cor: 'Preto' },
]

const item = (id, qtd = 1) => ({ ...CATALOGO.find((c) => c.id === id), qtd })

export const ordensIniciais = [
  { id: 'os1', numero: 1048, veiculoId: 'v2', relato: 'Barulho na roda dianteira ao frear.', status: 'execucao', entrada: iso(-1), previsao: iso(0), itens: [item('s3'), item('p3'), item('s2')], mecanico: 'Edson' },
  { id: 'os2', numero: 1047, veiculoId: 'v1', relato: 'Revisão dos 85 mil km.', status: 'pronto', entrada: iso(-2), previsao: iso(-1), itens: [item('s4'), item('p1'), item('p2'), item('p5')], mecanico: 'Edson' },
  { id: 'os3', numero: 1046, veiculoId: 'v3', relato: 'Troca de correia dentada preventiva.', status: 'execucao', entrada: iso(-2), previsao: iso(1), itens: [item('s6'), item('p4')], mecanico: 'Wesley' },
  { id: 'os4', numero: 1045, veiculoId: 'v5', relato: 'Luz de injeção acesa.', status: 'aprovacao', entrada: iso(-1), previsao: iso(2), itens: [item('s5'), item('p6')], mecanico: 'Wesley' },
  { id: 'os5', numero: 1044, veiculoId: 'v6', relato: 'Primeira revisão.', status: 'avaliacao', entrada: iso(0), previsao: iso(1), itens: [item('s1'), item('p1'), item('p2')], mecanico: 'Edson' },
  { id: 'os6', numero: 1043, veiculoId: 'v7', relato: 'Alinhamento puxando para a direita.', status: 'entregue', entrada: iso(-5), previsao: iso(-4), itens: [item('s2')], mecanico: 'Wesley' },
  { id: 'os7', numero: 1042, veiculoId: 'v8', relato: 'Troca de óleo.', status: 'entregue', entrada: iso(-7), previsao: iso(-7), itens: [item('s1'), item('p1'), item('p2')], mecanico: 'Edson' },
  { id: 'os8', numero: 1041, veiculoId: 'v4', relato: 'Revisão de frota.', status: 'entregue', entrada: iso(-9), previsao: iso(-8), itens: [item('s4'), item('p1'), item('p2'), item('p5')], mecanico: 'Wesley' },
]

export const orcamentosIniciais = [
  { id: 'o1', numero: 312, veiculoId: 'v9', validade: iso(5), status: 'enviado', itens: [item('s3'), item('p3')], obs: 'Pastilhas gastas no limite.' },
  { id: 'o2', numero: 311, veiculoId: 'v4', validade: iso(3), status: 'enviado', itens: [item('s6'), item('p4')], obs: 'Correia com 90 mil km rodados.' },
  { id: 'o3', numero: 310, veiculoId: 'v8', validade: iso(-2), status: 'recusado', itens: [item('s4')], obs: '' },
]

export const agendaInicial = [
  { id: 'a1', data: iso(0), hora: '08:00', veiculoId: 'v6', servico: 'Primeira revisão', duracao: 2 },
  { id: 'a2', data: iso(0), hora: '10:00', veiculoId: 'v1', servico: 'Entrega do veículo', duracao: 1 },
  { id: 'a3', data: iso(0), hora: '14:00', veiculoId: 'v9', servico: 'Avaliação de freios', duracao: 1 },
  { id: 'a4', data: iso(1), hora: '09:00', veiculoId: 'v4', servico: 'Troca de correia', duracao: 3 },
  { id: 'a5', data: iso(2), hora: '13:00', veiculoId: 'v8', servico: 'Diagnóstico com scanner', duracao: 1 },
  { id: 'a6', data: iso(3), hora: '08:00', veiculoId: 'v7', servico: 'Revisão completa', duracao: 3 },
]

export const financeiroInicial = [
  { id: 'f1', tipo: 'receber', desc: 'OS 1043 · Auto Peças Dois Irmãos', valor: 140, venc: iso(-4), pago: true, forma: 'Pix' },
  { id: 'f2', tipo: 'receber', desc: 'OS 1042 · Renato Salgado', valor: 343, venc: iso(-7), pago: true, forma: 'Cartão' },
  { id: 'f3', tipo: 'receber', desc: 'OS 1041 · Transportes Ribeiro', valor: 687, venc: iso(2), pago: false, forma: 'Boleto' },
  { id: 'f4', tipo: 'receber', desc: 'OS 1047 · Marcos Vieira (revisão)', valor: 687, venc: iso(0), pago: false, forma: 'Pix' },
  { id: 'f5', tipo: 'pagar', desc: 'Auto Peças Central · pedido 8841', valor: 1260, venc: iso(1), pago: false, forma: 'Boleto' },
  { id: 'f6', tipo: 'pagar', desc: 'Aluguel do galpão', valor: 2800, venc: iso(4), pago: false, forma: 'Pix' },
  { id: 'f7', tipo: 'pagar', desc: 'Energia elétrica', valor: 410, venc: iso(-3), pago: true, forma: 'Boleto' },
  { id: 'f8', tipo: 'receber', desc: 'OS 1040 · Jorge Teixeira', valor: 1180, venc: iso(-12), pago: true, forma: 'Pix' },
  { id: 'f9', tipo: 'receber', desc: 'OS 1039 · Camila Fernandes', valor: 460, venc: iso(-16), pago: true, forma: 'Cartão' },
]

// Receita das últimas 8 semanas (fictícia) para o gráfico do painel.
export const semanas = [
  { rot: 'S-7', v: 5200 }, { rot: 'S-6', v: 6100 }, { rot: 'S-5', v: 4800 }, { rot: 'S-4', v: 7300 },
  { rot: 'S-3', v: 6700 }, { rot: 'S-2', v: 8100 }, { rot: 'S-1', v: 7600 }, { rot: 'Esta', v: 4420 },
]

export const totalItens = (itens) => itens.reduce((s, i) => s + i.valor * i.qtd, 0)
