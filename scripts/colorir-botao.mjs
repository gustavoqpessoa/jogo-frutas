// Pinta a parte cinza (pedra) de um botão do mapa com outra cor, mantendo luz e sombra.
// A madeira e a estrela (que já têm cor) ficam como estão.
// Uso: node scripts/colorir-botao.mjs entrada.png saida.png "#escuro" "#claro"
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [entrada, saida, escuro = '#138a33', claro = '#b8ffad'] = process.argv.slice(2)
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const [e, c] = [rgb(escuro), rgb(claro)]

const png = PNG.sync.read(fs.readFileSync(entrada))
const px = png.data
for (let i = 0; i < px.length; i += 4) {
  if (px[i + 3] === 0) continue
  const [r, g, b] = [px[i], px[i + 1], px[i + 2]]
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  const media = (r + g + b) / 3
  // quanto mais cinza e claro, mais pinta; madeira (marrom e escura) e estrela (amarela) ficam
  const limita = (v) => Math.min(1, Math.max(0, v))
  const peso = limita((38 - sat) / 18) * limita((media - 55) / 35)
  if (peso === 0) continue
  const luz = limita((media - 60) / 170)
  for (let k = 0; k < 3; k++) {
    const pintado = e[k] + (c[k] - e[k]) * luz
    px[i + k] = Math.round(px[i + k] + (pintado - px[i + k]) * peso)
  }
}
fs.writeFileSync(saida, PNG.sync.write(png))
console.log('ok', saida)
