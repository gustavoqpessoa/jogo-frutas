// Prepara uma imagem gerada em IA com FUNDO BRANCO para o jogo: apaga o fundo
// (só o branco ligado às bordas, não o branco de dentro), limpa o contorno,
// corta a sobra e salva quadrada, centralizada e transparente.
// Uso: node scripts/preparar-imagem.mjs entrada.png saida.png [lado=512] [margem=0.06] [sem-buracos]
//   sem-buracos: não apaga branco cercado (personagens: o branco dos olhos é desenho)
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [entrada, saida, ladoArg, margemArg, opcao] = process.argv.slice(2)
const LADO = Number(ladoArg || 512)
const MARGEM = Number(margemArg || 0.06)

const img = PNG.sync.read(fs.readFileSync(entrada))
const { width: w, height: h, data: px } = img

// 1. fundo: inunda a partir das bordas tudo que for quase branco
const quaseBranco = (i) => px[i] > 225 && px[i + 1] > 225 && px[i + 2] > 225
const visto = new Uint8Array(w * h)
const fila = []
for (let x = 0; x < w; x++) fila.push(x, (h - 1) * w + x)
for (let y = 0; y < h; y++) fila.push(y * w, y * w + w - 1)
while (fila.length) {
  const p = fila.pop()
  if (visto[p]) continue
  visto[p] = 1
  if (!quaseBranco(p * 4)) continue
  px[p * 4 + 3] = 0
  const x = p % w
  if (x > 0) fila.push(p - 1)
  if (x < w - 1) fila.push(p + 1)
  if (p >= w) fila.push(p - w)
  if (p < w * (h - 1)) fila.push(p + w)
}

// 1b. buracos: fundo branco preso dentro do desenho (ex.: entre os cabinhos da
// cereja). O buraco fica colado no contorno escuro; o brilho da fruta fica no
// meio da cor, longe do contorno. Mede quanto do anel de 6px em volta é escuro.
function contornoEscuroEmVolta(mancha) {
  const dentro = new Set(mancha)
  const visto = new Set()
  let anel = 0
  let escuro = 0
  for (const p of mancha) {
    const x = p % w
    const y = (p / w) | 0
    for (let dy = -6; dy <= 6; dy++)
      for (let dx = -6; dx <= 6; dx++) {
        const q = (y + dy) * w + x + dx
        if (dentro.has(q) || visto.has(q) || q < 0 || q >= w * h) continue
        visto.add(q)
        anel++
        if (px[q * 4] + px[q * 4 + 1] + px[q * 4 + 2] < 150) escuro++
      }
  }
  return anel ? escuro / anel : 0
}
const marcado = new Uint8Array(w * h)
for (let inicio = 0; inicio < w * h; inicio++) {
  if (marcado[inicio] || px[inicio * 4 + 3] === 0 || !quaseBranco(inicio * 4)) continue
  const mancha = []
  const pilha = [inicio]
  marcado[inicio] = 1
  while (pilha.length) {
    const p = pilha.pop()
    mancha.push(p)
    const x = p % w
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
      if (q < 0 || q >= w * h || marcado[q]) continue
      if (px[q * 4 + 3] !== 0 && quaseBranco(q * 4)) {
        marcado[q] = 1
        pilha.push(q)
      }
    }
  }
  if (opcao !== 'sem-buracos' && mancha.length > 300 && contornoEscuroEmVolta(mancha) > 0.3) for (const p of mancha) px[p * 4 + 3] = 0
}

// 2. borda suave: pixel claro encostado no fundo fica meio transparente; encolhe 1px
const alfa = new Uint8Array(w * h)
for (let i = 0; i < w * h; i++) alfa[i] = px[i * 4 + 3]
for (let y = 1; y < h - 1; y++)
  for (let x = 1; x < w - 1; x++) {
    const i = y * w + x
    if (!alfa[i]) continue
    const vizinhoFundo = !alfa[i - 1] || !alfa[i + 1] || !alfa[i - w] || !alfa[i + w]
    if (!vizinhoFundo) continue
    const brilho = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3
    px[i * 4 + 3] = brilho > 170 ? 0 : 160
  }

// 3. corta a sobra e centraliza num quadrado com margem
let x0 = w, y0 = h, x1 = -1, y1 = -1
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++)
    if (px[(y * w + x) * 4 + 3] > 30) {
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
const larg = x1 - x0 + 1
const alt = y1 - y0 + 1
const util = Math.round(LADO * (1 - MARGEM * 2))
const escala = util / Math.max(larg, alt)
const out = new PNG({ width: LADO, height: LADO })
const ox = (LADO - larg * escala) / 2
const oy = (LADO - alt * escala) / 2
// reamostragem por média de área (reduz sem serrilhar)
for (let Y = 0; Y < LADO; Y++)
  for (let X = 0; X < LADO; X++) {
    const sx0 = (X - ox) / escala + x0, sy0 = (Y - oy) / escala + y0
    const sx1 = sx0 + 1 / escala, sy1 = sy0 + 1 / escala
    let r = 0, g = 0, b = 0, a = 0, n = 0
    for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++)
      for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) { n++; continue }
        const k = (sy * w + sx) * 4
        const al = px[k + 3]
        r += px[k] * al; g += px[k + 1] * al; b += px[k + 2] * al; a += al; n++
      }
    const o = (Y * LADO + X) * 4
    if (a > 0) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a }
    out.data[o + 3] = n ? a / n : 0
  }
fs.writeFileSync(saida, PNG.sync.write(out))
console.log(`${saida}: fruta ${larg}x${alt} -> ${LADO}x${LADO}`)
