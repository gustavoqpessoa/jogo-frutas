// Emenda pedaços de mapa (de CIMA para BAIXO) num só, com transição suave.
// Uso: node scripts/emendar-mapa.mjs saida.png img1.png:fim:suave:dx img2.png:fim:suave:dx ... ultima.png
//   fim   = até que linha usar do pedaço (vazio = inteiro)
//   suave = quantas linhas do fim se misturam com o começo do próximo
//   dx    = quanto a estrada precisa andar pro lado no fim do pedaço pra encontrar
//           a do próximo; o fim é entortado aos poucos (nas últimas 400 linhas).
//           Ou pontos "de/para" separados por + (ex.: 420/330+600/450): cada x do fim
//           deste pedaço vai parar no x do começo do próximo (encaixa as duas bordas).
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [saida, ...pecas] = process.argv.slice(2)
const lista = pecas.map((p) => {
  const [arq, fim, suave, dx] = p.split(':')
  const img = PNG.sync.read(fs.readFileSync(arq))
  const w = img.width
  // pontos de/para; um número só vira um deslocamento igual pra todo x
  let pares = [[0, 0], [w - 1, w - 1]]
  if (dx && dx.includes('/')) pares = [[0, 0], ...dx.split('+').map((q) => q.split('/').map(Number)), [w - 1, w - 1]]
  else if (dx) pares = [[0, Number(dx)], [w - 1, w - 1 + Number(dx)]]
  return { img, fim: fim ? Number(fim) : img.height, suave: Number(suave || 0), pares, entorta: !!dx }
})
const w = lista[0].img.width
const altura = lista.reduce((s, p) => s + p.fim, 0) - lista.reduce((s, p, i) => s + (i < lista.length - 1 ? p.suave : 0), 0)
const out = new PNG({ width: w, height: altura })
let y0 = 0
lista.forEach((p, i) => {
  const ant = lista[i - 1]
  const misturaInicio = i > 0 ? ant.suave : 0
  for (let y = 0; y < p.fim; y++) {
    const Y = y0 + y - misturaInicio
    if (Y < 0 || Y >= altura) continue
    const peso = y < misturaInicio ? y / misturaInicio : 1 // 0 = só o de cima, 1 = só este
    // entorta o fim do pedaço aos poucos (curva suave) até os pontos "de" chegarem no "para"
    const faixa = 400
    const t0 = p.entorta && y > p.fim - faixa ? (y - (p.fim - faixa)) / faixa : 0
    const t = t0 * t0 * (3 - 2 * t0)
    const destino = p.pares.map(([de, para]) => de + (para - de) * t)
    for (let x = 0; x < w; x++) {
      const o = (Y * w + x) * 4
      // x na tela -> de onde ele vem na imagem original (interpolação entre os pontos)
      let i = 1
      while (i < destino.length - 1 && destino[i] < x) i++
      const a = destino[i - 1], b = destino[i]
      const fr = b === a ? 0 : (x - a) / (b - a)
      let sx = Math.round(p.pares[i - 1][0] + fr * (p.pares[i][0] - p.pares[i - 1][0]))
      // fora da imagem: espelha (repete a vegetação da beirada em vez de esticar)
      if (sx < 0) sx = -sx
      if (sx >= p.img.width) sx = 2 * p.img.width - sx - 2
      const k = (y * p.img.width + sx) * 4
      for (let c = 0; c < 3; c++) out.data[o + c] = out.data[o + c] * (1 - peso) + p.img.data[k + c] * peso
      out.data[o + 3] = 255
    }
  }
  y0 += p.fim - misturaInicio
})
fs.writeFileSync(saida, PNG.sync.write(out))
console.log(saida, w + 'x' + altura)
