import { contextQuotes, shortMessageQuotes } from './quotes'
import { curtas } from './levels'

// Uma frase da lista do nível; troca a cada envio e fica parada entre um envio e outro. Até o amarelo (6 listas), quem vem mandando mensagens curtas recebe a lista que sugere o microfone.
export const frase = (n: number, enviados: number, recentes: number[]) => {
  const lista = (curtas(recentes) ? shortMessageQuotes[n] : undefined) ?? contextQuotes[n] ?? []

  return lista[enviados % lista.length] ?? ''
}
