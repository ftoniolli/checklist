export const SITUATION_LABEL = {
  em_operacao: 'Em operação',
  em_manutencao: 'Em manutenção',
  parada: 'Parada',
  arquivada: 'Arquivada'
}

export const STATE_LABEL = {
  nao_inspecionado: 'Não inspecionado',
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
  nao_se_aplica: 'Não se aplica'
}

export const SEVERITY_LABEL = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
}

export const CORRECTION_LABEL = {
  aberta: 'Aberta',
  em_correcao: 'Em correção',
  concluida: 'Concluída'
}

export const PHYSICAL_LABEL = {
  nao_verificado: 'Não verificado',
  bom: 'Bom',
  regular: 'Regular',
  danificado: 'Danificado'
}

export const FUNCTIONAL_LABEL = {
  nao_verificado: 'Não verificado',
  operante: 'Operante',
  parcial: 'Parcial',
  inoperante: 'Inoperante'
}

export const RESULT_LABEL = {
  aprovado: 'Aprovado',
  aprovado_com_ressalvas: 'Aprovado com ressalvas',
  reprovado: 'Reprovado',
  nao_realizado: 'Não realizado'
}

export const SCOPE_LABEL = {
  maquina: 'Máquina',
  componente: 'Componente',
  ambos: 'Máquina e componente'
}

export const ROLE_LABEL = {
  '': 'Sem associação',
  trator: 'Trator',
  implemento: 'Implemento'
}

export function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatDay(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return String(value)
  return `${day}/${month}/${year}`
}
