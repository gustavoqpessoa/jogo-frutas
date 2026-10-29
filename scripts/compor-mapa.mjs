// Junta trechos de imagens (de CIMA para BAIXO), costurando cada emenda.
// Uso: node scripts/compor-mapa.mjs saida.png sobreposicao arq:y0:y1 arq:y0:y1 ...
//   y0..y1 = linhas usadas de cada imagem. As últimas `sobreposicao` linhas de um
//   trecho ficam por cima das primeiras do próximo; dentro dessa faixa o corte segue
//   o caminho onde as duas imagens mais se parecem (desvia de casas e árvores), em
//   vez de uma linha reta. Só os poucos pixels em volta do caminho se misturam.
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [saida, misturaArg, ...pecas] = process.argv.slice(2)
const M = Number(misturaArg)
const cache = {}
const lista = pecas.map((p) => {
  const [arq, y0, y1] = p.split(':')
  cache[arq] ||= PNG.sync.read(fs.readFileSync(arq))
  return { img: cache[arq], y0: Number(y0), y1: Number(y1) }
})
const w = lista[0].img.width
const altura = lista.reduce((s, p) => s + (p.y1 - p.y0), 0) - M * (lista.length - 1)
const out = new PNG({ width: w, height: altura })
const px = (p, y, x) => (y * p.img.width + Math.min(x, p.img.width - 1)) * 4

// caminho de menor diferença atravessando a faixa de sobreposição (programação dinâmica)
function caminho(a, b) {
  const custo = (y, x) => {
    const ka = px(a, a.y1 - M + y, x)
    const kb = px(b, b.y0 + y, x)
    return Math.abs(a.img.data[ka] - b.img.data[kb]) + Math.abs(a.img.data[ka + 1] - b.img.data[kb + 1]) + Math.abs(a.img.data[ka + 2] - b.img.data[kb + 2])
  }
  const acc = Array.from({ length: w }, () => new Float64Array(M))
  const de = Array.from({ length: w }, () => new Int16Array(M))
  for (let y = 0; y < M; y++) acc[0][y] = custo(y, 0)
  for (let x = 1; x < w; x++)
    for (let y = 0; y < M; y++) {
      let melhor = Infinity
      for (let d = -2; d <= 2; d++) {
        const yy = y + d
        if (yy >= 0 && yy < M && acc[x - 1][yy] < melhor) {
          melhor = acc[x - 1][yy]
          de[x][y] = yy
        }
      }
      // evita encostar nas pontas da faixa
      const borda = y < 4 || y > M - 5 ? 2000 : 0
      acc[x][y] = melhor + custo(y, x) + borda
    }
  let y = 0
  for (let k = 1; k < M; k++) if (acc[w - 1][k] < acc[w - 1][y]) y = k
  const linha = new Int16Array(w)
  for (let x = w - 1; x >= 0; x--) {
    linha[x] = y
    y = de[x][y]
  }
  return linha
}
const caminhos = lista.map((p, i) => (i > 0 && M > 0 ? caminho(lista[i - 1], p) : null))

// conferência: na faixa de sobreposição as duas imagens têm que mostrar o mesmo lugar
lista.forEach((p, i) => {
  if (!i || !M) return
  const a = lista[i - 1]
  let soma = 0
  let n = 0
  for (let y = 0; y < M; y += 3)
    for (let x = 0; x < w; x += 3) {
      const ka = px(a, a.y1 - M + y, x)
      const kb = px(p, p.y0 + y, x)
      soma += Math.abs(a.img.data[ka] - p.img.data[kb]) + Math.abs(a.img.data[ka + 1] - p.img.data[kb + 1]) + Math.abs(a.img.data[ka + 2] - p.img.data[kb + 2])
      n++
    }
  console.log(`emenda ${i}: diferença média ${(soma / n / 3).toFixed(1)} (perto de 0 = encaixe perfeito)`)
})

let Y0 = 0
lista.forEach((p, i) => {
  for (let y = p.y0; y < p.y1; y++) {
    const Y = Y0 + (y - p.y0)
    for (let x = 0; x < w; x++) {
      const o = (Y * w + x) * 4
      const k = (y * p.img.width + Math.min(x, p.img.width - 1)) * 4
      // na faixa de sobreposição: abaixo do caminho vale este trecho, acima o anterior
      const dy = y - p.y0
      const peso = !caminhos[i] || dy >= M ? 1 : Math.max(0, Math.min(1, (dy - caminhos[i][x] + 3) / 6))
      for (let c = 0; c < 3; c++) out.data[o + c] = out.data[o + c] * (1 - peso) + p.img.data[k + c] * peso
      out.data[o + 3] = 255
    }
  }
  Y0 += p.y1 - p.y0 - M
})
fs.writeFileSync(saida, PNG.sync.write(out))
console.log(saida, w + 'x' + altura)
