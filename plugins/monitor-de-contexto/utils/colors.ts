// Bar colour per level band: green up to 150k, yellow up to 300k, orange up to 450k, red from there on.
export const EMPTY = '#D3D1C7'

export const color = (n: number) => (n < 3 ? '#639922' : n < 6 ? '#BA7517' : n < 9 ? '#D85A30' : '#E24B4A')
