// Acha a estradinha de terra desenhada no mapa e grava N pontos igualmente
// espaçados ao longo dela (de baixo pra cima), em fração da imagem (0 a 1).
// Uso: node scripts/achar-estrada.mjs mapa.png saida.js [fases=30] [desenho.png]
//   desenho.png (opcional): grava o mapa com a linha da estrada e os pontos, pra conferir.
//
// A estrada é uma faixa de terra laranja com a calçadinha de pedras cinza dos dois
// lados. Areia da praia e terraços alaranjados também são "terra", então cada linha
// escolhe o trecho que (1) tem calçada cinza nas duas pontas, (2) tem largura
// parecida com a da linha anterior e (3) não pula de lugar.
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [entrada, saida, nArg, desenho] = process.argv.slice(2)
const N = Number(nArg || 30)
const img = PNG.sync.read(fs.readFileSync(entrada))
const { width: w, height: h, data: d } = img

const cor = (x, y) => {
  const k = (y * w + x) * 4
  return [d[k], d[k + 1], d[k + 2]]
}
const eTerra = (x, y) => {
  const [r, g, b] = cor(x, y)
  return r > 200 && g > 120 && b < 150 && r - b > 75 && r - g < 110
}
// pedra da calçada: cinza/bege pouco saturado, nem muito escuro nem branco
const ePedra = (x, y) => {
  if (x < 0 || x >= w) return false
  const [r, g, b] = cor(x, y)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 70 && max > 90 && max < 235
}
// quanto de pedra há numa janela logo depois da ponta do trecho (para fora)
const pedraPerto = (x, dir, y) => {
  let n = 0
  for (let k = 2; k <= 26; k++) if (ePedra(x + dir * k, y)) n++
  return n / 25
}

// trechos de terra de cada linha
function trechos(y) {
  const lista = []
  let ini = -1
  for (let x = 0; x <= w; x++) {
    const t = x < w && eTerra(x, y)
    if (t && ini < 0) ini = x
    if (!t && ini >= 0) {
      if (x - ini >= 50 && x - ini <= 260) lista.push([ini, x - 1])
      ini = -1
    }
  }
  return lista
}

// começo: linha de baixo, trecho com calçada dos dois lados mais perto do meio
const PASSO = 3
let atual = null
for (let y = h - 1; y > h - 200 && !atual; y -= PASSO) {
  const cand = trechos(y)
    .map(([a, b]) => ({ a, b, nota: pedraPerto(a, -1, y) + pedraPerto(b, 1, y) - Math.abs((a + b) / 2 - w / 2) / w }))
    .filter((c) => c.nota > 0.6)
    .sort((p, q) => q.nota - p.nota)
  if (cand[0]) atual = { c: (cand[0].a + cand[0].b) / 2, larg: cand[0].b - cand[0].a, y }
}
if (!atual) throw new Error('não achei o começo da estrada')

const centros = [{ x: atual.c, y: atual.y }]
const larguras = [atual.larg]
let perdidas = 0
for (let y = atual.y - PASSO; y >= 0; y -= PASSO) {
  let melhor = null
  for (const [a, b] of trechos(y)) {
    const c = (a + b) / 2
    const larg = b - a
    const salto = Math.abs(c - atual.c)
    if (salto > 14 + perdidas * 6) continue
    // trecho muito mais largo que a estrada = estrada grudada em areia: usa a ponta
    // que tem calçada e mantém a largura da estrada
    let ca = a
    let cb = b
    // (numa curva a estrada fica mais larga na horizontal, então só corta se for MUITO mais larga)
    if (larg > atual.larg * 1.9) {
      const pe = pedraPerto(a, -1, y)
      const pd = pedraPerto(b, 1, y)
      if (pe >= pd) cb = a + atual.larg
      else ca = b - atual.larg
    }
    const cc = (ca + cb) / 2
    if (Math.abs(cc - atual.c) > 14 + perdidas * 6) continue
    const nota =
      pedraPerto(ca, -1, y) + pedraPerto(cb, 1, y) - Math.abs(cc - atual.c) / 20 - Math.abs(cb - ca - atual.larg) / 120
    if (!melhor || nota > melhor.nota) melhor = { c: cc, larg: cb - ca, nota }
  }
  if (melhor) {
    atual = { c: melhor.c, larg: atual.larg * 0.6 + melhor.larg * 0.4, y }
    centros.push({ x: atual.c, y })
    larguras.push(melhor.larg)
    perdidas = 0
  } else {
    perdidas++ // ponte, sombra: segue reto até reencontrar
  }
}

// suaviza
const suave = centros.map((p, i) => {
  const viz = centros.slice(Math.max(0, i - 5), i + 6)
  return { x: viz.reduce((s, q) => s + q.x, 0) / viz.length, y: p.y }
})

// distribui N pontos pelo comprimento da estrada, deixando margem nas pontas
const dist = [0]
for (let i = 1; i < suave.length; i++) dist.push(dist[i - 1] + Math.hypot(suave[i].x - suave[i - 1].x, suave[i].y - suave[i - 1].y))
const total = dist[dist.length - 1]
const pontos = []
for (let k = 0; k < N; k++) {
  const alvo = total * (0.025 + (0.93 * k) / (N - 1))
  let i = dist.findIndex((v) => v >= alvo)
  if (i < 1) i = 1
  const t = (alvo - dist[i - 1]) / (dist[i] - dist[i - 1] || 1)
  pontos.push({ x: suave[i - 1].x + (suave[i].x - suave[i - 1].x) * t, y: suave[i - 1].y + (suave[i].y - suave[i - 1].y) * t })
}

// ajuste manual de fases que ficaram fora do centro (ex.: moita cobrindo a estrada):
// AJUSTES = '15:-14,36:+20' -> move a fase N tantos pixels da imagem na horizontal
const ajustes = process.env.AJUSTES || ''
for (const par of ajustes.split(',').filter(Boolean)) {
  const [n, dx] = par.split(':').map(Number)
  if (pontos[n - 1]) pontos[n - 1].x += dx
}

fs.writeFileSync(
  saida,
  `// Gerado por scripts/achar-estrada.mjs: onde fica cada fase na estradinha do mapa\n// (fração da largura e da altura da imagem, fase 1 primeiro). Não editar à mão.\nexport const VERSAO = ${Date.now()} // muda a cada mapa novo: força o navegador a baixar a imagem nova\nexport const PROPORCAO = ${(h / w).toFixed(4)}\nexport const LARGURA_ESTRADA = ${(larguras.sort((a, b) => a - b)[larguras.length >> 1] / w).toFixed(4)} // típica, em fração da largura\nexport const PONTOS = ${JSON.stringify(pontos.map((p) => [+(p.x / w).toFixed(4), +(p.y / h).toFixed(4)]))}\n`,
)
console.log('estrada:', centros.length, 'linhas, da altura', centros[0].y, 'até', centros[centros.length - 1].y, '- comprimento', Math.round(total), 'px ->', N, 'pontos')

if (desenho) {
  const marca = (x, y, r, rgb) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const X = Math.round(x + dx), Y = Math.round(y + dy)
        if (X < 0 || Y < 0 || X >= w || Y >= h || dx * dx + dy * dy > r * r) continue
        const k = (Y * w + X) * 4
        d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]
      }
  }
  for (const p of suave) marca(p.x, p.y, 2, [255, 0, 255])
  for (const p of pontos) marca(p.x, p.y, 14, [20, 20, 200])
  fs.writeFileSync(desenho, PNG.sync.write(img))
}
