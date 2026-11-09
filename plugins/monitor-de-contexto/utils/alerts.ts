import { curtas, curtoEm } from './levels'

// Limites em tokens do total usado na janela (linha de contexto do /context).
const APROXIMANDO = 200_000
const ATENCAO = 250_000
const COMPACTAR = 600_000

// A linha Messages precisa ser pelo menos esta fração do total para contar como "a maior parte".
const METADE = 0.5

export type Alerta = 'livre' | 'aproximando' | 'atencao' | 'curta' | 'compactar'

export type Entrada = {
  total: number | null
  mensagens: number | null
  // Tamanho em caracteres dos últimos envios, do mais antigo ao mais recente.
  recentes: number[]
}

export const alerta = ({ total, mensagens, recentes }: Entrada): Alerta => {
  if (total === null) {
    return 'livre'
  }

  if (total >= COMPACTAR) {
    return 'compactar'
  }

  if (total >= ATENCAO) {
    if (mensagens === null || mensagens / total < METADE) {
      return 'livre'
    }

    const ultimo = recentes[recentes.length - 1]
    return ultimo !== undefined && curtoEm(ultimo) ? 'curta' : 'atencao'
  }

  if (total >= APROXIMANDO) {
    return curtas(recentes) ? 'aproximando' : 'livre'
  }

  return 'livre'
}

// Frases de apoio de cada alerta, todas com até 72 caracteres.
export const frasesDeAlerta: Record<Exclude<Alerta, 'livre'>, string> = {
  aproximando: 'Suas últimas mensagens foram curtas e a janela está quase no limite',
  atencao: 'A janela já está grande e vale compactar quando a tarefa terminar',
  curta: 'Juntar o que falta num envio só evita reler a janela inteira',
  compactar: 'A janela passou de 600 mil tokens e precisa ser compactada agora',
}
