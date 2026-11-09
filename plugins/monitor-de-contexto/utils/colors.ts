// Cor das barras por faixa de nível: verde até 150k, amarelo até 300k, laranja até 450k, vermelho daí em diante.
export const VAZIA = '#D3D1C7'

export const cor = (n: number) => (n < 3 ? '#639922' : n < 6 ? '#BA7517' : n < 9 ? '#D85A30' : '#E24B4A')
