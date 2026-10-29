// Tamanho de cada uma das 10 posições, da menor pra maior. É igual em todos os
// mundos; o que muda é a fruta (imagens em public/frutas/mundoN/0.png ... 9.png).
// as grandes crescem menos: a melancia ocupa menos da metade do pote
export const FRUTAS = [17, 23, 30, 37, 45, 53, 61, 68, 74, 80].map((raio) => ({ raio }))

export const MUNDOS = [
  { nome: 'Feira', frutas: ['Uva', 'Cereja', 'Morango', 'Limão', 'Laranja', 'Maçã', 'Pêssego', 'Abacaxi', 'Melão', 'Melancia'] },
  { nome: 'Tropical', frutas: ['Acerola', 'Jabuticaba', 'Caju', 'Maracujá', 'Goiaba', 'Carambola', 'Manga', 'Mamão', 'Coco', 'Jaca'] },
  { nome: 'Pomar', frutas: ['Mirtilo', 'Framboesa', 'Ameixa', 'Kiwi', 'Figo', 'Pera', 'Limão-siciliano', 'Romã', 'Toranja', 'Abóbora'] },
  { nome: 'Exótico', frutas: ['Physalis', 'Lichia', 'Rambutã', 'Mangostim', 'Kiwano', 'Pinha', 'Pitaya', 'Melão dourado', 'Durião', 'Melancia dourada'] },
]

// Cada fruta é desenhada uma vez num "carimbo" grande e depois só copiada.
// R = raio do desenho; a folga deixa espaço pro cabinho e folhas.
const R = 100
const FOLGA = 1.5
const LADO = Math.ceil(R * 2 * FOLGA)

// Frutas carregadas de cada mundo; "ativo" é o mundo da fase em jogo.
const porMundo = {}
let ativo = { imagens: [], formas: [], daIA: [] }
let mundoAtivo = 1

const TAU = Math.PI * 2

// Bola com volume: luz em cima à esquerda, sombra embaixo à direita.
function esfera(ctx, clara, media, escura, raio = R, cx = 0, cy = 0) {
  const g = ctx.createRadialGradient(cx - raio * 0.35, cy - raio * 0.4, raio * 0.05, cx, cy, raio)
  g.addColorStop(0, clara)
  g.addColorStop(0.5, media)
  g.addColorStop(1, escura)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, raio, 0, TAU)
  ctx.fill()
}

// Reflexo de luz forte (o "brilho de doce").
function reflexo(ctx, raio = R, cx = 0, cy = 0, forca = 0.85) {
  const g = ctx.createRadialGradient(cx - raio * 0.38, cy - raio * 0.45, 0, cx - raio * 0.38, cy - raio * 0.45, raio * 0.42)
  g.addColorStop(0, `rgba(255,255,255,${forca})`)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx - raio * 0.38, cy - raio * 0.45, raio * 0.42, raio * 0.3, -0.6, 0, TAU)
  ctx.fill()
  ctx.fillStyle = `rgba(255,255,255,${forca})`
  ctx.beginPath()
  ctx.ellipse(cx - raio * 0.42, cy - raio * 0.5, raio * 0.12, raio * 0.07, -0.6, 0, TAU)
  ctx.fill()
}

// Luz rebatida embaixo à direita: brilho suave que dá sensação de 3D.
function bordaDeLuz(ctx, cor, raio = R) {
  const g = ctx.createRadialGradient(raio * 0.45, raio * 0.55, 0, raio * 0.45, raio * 0.55, raio * 0.55)
  g.addColorStop(0, cor.replace(/[\d.]+\)$/, '0.35)'))
  g.addColorStop(1, cor.replace(/[\d.]+\)$/, '0)'))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, raio, 0, TAU)
  ctx.fill()
}

function recortarCirculo(ctx, raio = R) {
  ctx.beginPath()
  ctx.arc(0, 0, raio, 0, TAU)
  ctx.clip()
}

function folha(ctx, x, y, tam, ang, cor = '#4caf27', escura = '#2e7d14') {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  const g = ctx.createLinearGradient(0, -tam * 0.3, 0, tam * 0.3)
  g.addColorStop(0, cor)
  g.addColorStop(1, escura)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(tam * 0.5, -tam * 0.45, tam, 0)
  ctx.quadraticCurveTo(tam * 0.5, tam * 0.45, 0, 0)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.35)'
  ctx.lineWidth = tam * 0.04
  ctx.beginPath()
  ctx.moveTo(tam * 0.1, 0)
  ctx.lineTo(tam * 0.85, 0)
  ctx.stroke()
  ctx.restore()
}

function cabinho(ctx, x0, y0, x1, y1, curva, grossura = 7) {
  ctx.strokeStyle = '#6b3d14'
  ctx.lineCap = 'round'
  ctx.lineWidth = grossura
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.quadraticCurveTo(curva, (y0 + y1) / 2, x1, y1)
  ctx.stroke()
}

// Poros/pintinhas espalhados dentro do círculo.
function pontilhado(ctx, n, cor, tam, raio = R * 0.88) {
  ctx.fillStyle = cor
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996
    const d = raio * Math.sqrt((i + 0.5) / n)
    ctx.beginPath()
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, tam, 0, TAU)
    ctx.fill()
  }
}

const DESENHOS = [
  // 0 uva
  (ctx) => {
    esfera(ctx, '#d9a8ff', '#8e3fd6', '#3d0f73')
    ctx.fillStyle = 'rgba(200,170,255,.18)'
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.96, 0, TAU)
    ctx.fill()
    bordaDeLuz(ctx, 'rgba(255,150,230,.45)')
    reflexo(ctx)
    cabinho(ctx, 0, -R * 0.92, R * 0.1, -R * 1.2, R * 0.2, 9)
  },
  // 1 cereja
  (ctx) => {
    cabinho(ctx, 0, -R * 0.75, R * 0.35, -R * 1.25, -R * 0.1, 8)
    folha(ctx, R * 0.33, -R * 1.2, R * 0.55, -0.3)
    esfera(ctx, '#ff8a8a', '#e0102f', '#6e0014')
    ctx.fillStyle = 'rgba(90,0,15,.35)'
    ctx.beginPath()
    ctx.ellipse(0, -R * 0.78, R * 0.18, R * 0.08, 0, 0, TAU)
    ctx.fill()
    bordaDeLuz(ctx, 'rgba(255,120,120,.5)')
    reflexo(ctx)
  },
  // 2 morango
  (ctx) => {
    ctx.save()
    const forma = () => {
      ctx.beginPath()
      ctx.moveTo(0, R)
      ctx.bezierCurveTo(-R * 0.7, R * 0.85, -R * 1.08, R * 0.05, -R * 0.95, -R * 0.45)
      ctx.bezierCurveTo(-R * 0.8, -R * 0.95, R * 0.8, -R * 0.95, R * 0.95, -R * 0.45)
      ctx.bezierCurveTo(R * 1.08, R * 0.05, R * 0.7, R * 0.85, 0, R)
      ctx.closePath()
    }
    forma()
    ctx.clip()
    esfera(ctx, '#ff9a9a', '#ef1d3a', '#7a0018', R * 1.05)
    ctx.fillStyle = '#ffe27a'
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996
      const d = R * 0.85 * Math.sqrt((i + 0.5) / 26)
      const x = Math.cos(a) * d
      const y = Math.sin(a) * d + R * 0.1
      ctx.beginPath()
      ctx.ellipse(x, y, R * 0.035, R * 0.055, a * 0.2, 0, TAU)
      ctx.fill()
    }
    reflexo(ctx, R, 0, R * 0.05, 0.7)
    ctx.restore()
    for (let i = 0; i < 5; i++) folha(ctx, 0, -R * 0.72, R * 0.5, -Math.PI / 2 + (i - 2) * 0.62, '#5ccf2e', '#2b7a10')
    cabinho(ctx, 0, -R * 0.8, R * 0.05, -R * 1.1, 0, 9)
  },
  // 3 limão (verde)
  (ctx) => {
    esfera(ctx, '#e6ff9e', '#7fd12a', '#2f6e07')
    ctx.save()
    recortarCirculo(ctx)
    pontilhado(ctx, 60, 'rgba(40,100,0,.18)', R * 0.025)
    ctx.restore()
    bordaDeLuz(ctx, 'rgba(230,255,150,.55)')
    reflexo(ctx)
    ctx.fillStyle = '#4c8f12'
    ctx.beginPath()
    ctx.ellipse(R * 0.92, -R * 0.05, R * 0.12, R * 0.09, 0, 0, TAU)
    ctx.fill()
  },
  // 4 laranja
  (ctx) => {
    esfera(ctx, '#ffe29a', '#ff9a12', '#b34700')
    ctx.save()
    recortarCirculo(ctx)
    pontilhado(ctx, 90, 'rgba(160,60,0,.16)', R * 0.022)
    ctx.restore()
    bordaDeLuz(ctx, 'rgba(255,230,140,.55)')
    reflexo(ctx)
    ctx.fillStyle = '#3d7a12'
    ctx.beginPath()
    ctx.arc(0, -R * 0.9, R * 0.08, 0, TAU)
    ctx.fill()
    folha(ctx, 0, -R * 0.92, R * 0.55, -0.45)
  },
  // 5 maçã
  (ctx) => {
    cabinho(ctx, 0, -R * 0.62, R * 0.12, -R * 1.15, -R * 0.05, 10)
    folha(ctx, R * 0.08, -R * 0.95, R * 0.6, -0.5)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, -R * 0.62)
    ctx.bezierCurveTo(R * 0.55, -R * 1.05, R * 1.12, -R * 0.5, R * 0.98, R * 0.15)
    ctx.bezierCurveTo(R * 0.88, R * 0.75, R * 0.45, R * 1.02, 0, R * 0.9)
    ctx.bezierCurveTo(-R * 0.45, R * 1.02, -R * 0.88, R * 0.75, -R * 0.98, R * 0.15)
    ctx.bezierCurveTo(-R * 1.12, -R * 0.5, -R * 0.55, -R * 1.05, 0, -R * 0.62)
    ctx.clip()
    esfera(ctx, '#ff9d8a', '#e3172b', '#6a0010', R * 1.1)
    ctx.fillStyle = 'rgba(255,200,60,.14)'
    ctx.beginPath()
    ctx.ellipse(R * 0.45, R * 0.25, R * 0.4, R * 0.5, -0.4, 0, TAU)
    ctx.fill()
    reflexo(ctx, R, 0, R * 0.05)
    ctx.restore()
  },
  // 6 pêssego
  (ctx) => {
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.05, 0, 0, R)
    g.addColorStop(0, '#fff1c2')
    g.addColorStop(0.45, '#ffb36b')
    g.addColorStop(0.8, '#ff6b5a')
    g.addColorStop(1, '#b8283a')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, R, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = 'rgba(160,40,40,.35)'
    ctx.lineWidth = R * 0.05
    ctx.beginPath()
    ctx.moveTo(R * 0.05, -R * 0.92)
    ctx.bezierCurveTo(R * 0.45, -R * 0.35, R * 0.4, R * 0.4, R * 0.1, R * 0.95)
    ctx.stroke()
    bordaDeLuz(ctx, 'rgba(255,220,160,.5)')
    reflexo(ctx, R, 0, 0, 0.55)
    folha(ctx, 0, -R * 0.92, R * 0.6, -0.6)
  },
  // 7 abacaxi
  (ctx) => {
    for (let i = 0; i < 7; i++) folha(ctx, 0, -R * 0.82, R * (0.55 + (i % 2) * 0.12), -Math.PI / 2 + (i - 3) * 0.32, '#5ccf2e', '#1f6b0c')
    esfera(ctx, '#ffe98a', '#f5a312', '#8a4b00')
    ctx.save()
    recortarCirculo(ctx)
    ctx.strokeStyle = 'rgba(120,60,0,.45)'
    ctx.lineWidth = R * 0.035
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath()
      ctx.moveTo(-R * 1.2, i * R * 0.3 - R * 1.2)
      ctx.lineTo(R * 1.2, i * R * 0.3 + R * 1.2)
      ctx.moveTo(-R * 1.2, i * R * 0.3 + R * 1.2)
      ctx.lineTo(R * 1.2, i * R * 0.3 - R * 1.2)
      ctx.stroke()
    }
    pontilhado(ctx, 40, 'rgba(255,240,170,.55)', R * 0.04)
    ctx.restore()
    bordaDeLuz(ctx, 'rgba(255,240,160,.5)')
    reflexo(ctx, R, 0, 0, 0.6)
  },
  // 8 melão
  (ctx) => {
    esfera(ctx, '#fbf0b8', '#d8c46a', '#7d6a1c')
    ctx.save()
    recortarCirculo(ctx)
    ctx.strokeStyle = 'rgba(255,250,225,.45)'
    ctx.lineWidth = R * 0.025
    for (let i = 0; i < 40; i++) {
      const a = i * 2.39996
      const d = R * Math.sqrt((i + 0.5) / 40)
      const x = Math.cos(a) * d
      const y = Math.sin(a) * d
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a * 3) * R * 0.18, y + Math.sin(a * 3) * R * 0.18)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(120,150,40,.35)'
    ctx.lineWidth = R * 0.05
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.ellipse(i * R * 0.4, 0, R * 0.12, R * 1.05, 0, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
    bordaDeLuz(ctx, 'rgba(255,250,200,.55)')
    reflexo(ctx, R, 0, 0, 0.6)
  },
  // 9 melancia
  (ctx) => {
    esfera(ctx, '#b8f27a', '#3fa524', '#0f4d05')
    ctx.save()
    recortarCirculo(ctx)
    ctx.fillStyle = '#145c0a'
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath()
      const x = i * R * 0.34
      ctx.moveTo(x - R * 0.06, -R)
      for (let y = -R; y <= R; y += R * 0.1) ctx.lineTo(x + Math.sin(y * 0.09) * R * 0.07 - R * 0.07, y)
      for (let y = R; y >= -R; y -= R * 0.1) ctx.lineTo(x + Math.sin(y * 0.09 + 1) * R * 0.07 + R * 0.07, y)
      ctx.fill()
    }
    ctx.restore()
    // volume por cima das listras
    const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R)
    g.addColorStop(0, 'rgba(255,255,255,.25)')
    g.addColorStop(0.6, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,30,0,.45)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, R, 0, TAU)
    ctx.fill()
    bordaDeLuz(ctx, 'rgba(200,255,150,.5)')
    reflexo(ctx)
    ctx.fillStyle = '#6b8a1a'
    ctx.beginPath()
    ctx.arc(0, -R * 0.96, R * 0.06, 0, TAU)
    ctx.fill()
  },
]

function desenhoVetor(nivel) {
  const c = document.createElement('canvas')
  c.width = c.height = LADO
  const ctx = c.getContext('2d')
  ctx.translate(LADO / 2, LADO / 2)
  DESENHOS[nivel](ctx)
  return c
}

// Imagem vinda de IA: tira fundo liso (se vier branco), corta a sobra e centraliza
// num quadrado, pra fruta encher o círculo da física.
function prepararImagemIA(img) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const { width: w, height: h } = c
  const dados = ctx.getImageData(0, 0, w, h)
  const px = dados.data

  // fundo sem transparência: apaga tudo que for parecido com a cor dos cantos e
  // estiver ligado a eles (não apaga o branco de dentro da fruta)
  if (px[3] > 250) {
    const ref = [px[0], px[1], px[2]]
    const parecido = (i) => Math.abs(px[i] - ref[0]) + Math.abs(px[i + 1] - ref[1]) + Math.abs(px[i + 2] - ref[2]) < 60
    const visto = new Uint8Array(w * h)
    const fila = [0, w - 1, (h - 1) * w, h * w - 1]
    while (fila.length) {
      const p = fila.pop()
      if (visto[p]) continue
      visto[p] = 1
      if (!parecido(p * 4)) continue
      px[p * 4 + 3] = 0
      const x = p % w
      if (x > 0) fila.push(p - 1)
      if (x < w - 1) fila.push(p + 1)
      if (p >= w) fila.push(p - w)
      if (p < w * (h - 1)) fila.push(p + w)
    }
    ctx.putImageData(dados, 0, 0)
  }

  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 20) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  tirarBordaClara(px, w, h)
  ctx.putImageData(dados, 0, 0)

  if (x1 < x0) return { imagem: c, forma: null }
  const larg = x1 - x0 + 1
  const alt = y1 - y0 + 1
  const lado = Math.max(larg, alt)
  const fruta = document.createElement('canvas')
  fruta.width = fruta.height = lado
  fruta.getContext('2d').drawImage(c, x0, y0, larg, alt, (lado - larg) / 2, (lado - alt) / 2, larg, alt)
  const forma = contorno(fruta)

  // sombra suave em volta: assenta a fruta no cenário em vez de parecer adesivo
  const pad = Math.round(lado * SOMBRA)
  const saida = document.createElement('canvas')
  saida.width = saida.height = lado + pad * 2
  const sctx = saida.getContext('2d')
  sctx.shadowColor = 'rgba(30,0,70,.45)'
  sctx.shadowBlur = lado * 0.035
  sctx.shadowOffsetY = lado * 0.015
  sctx.drawImage(fruta, pad, pad)
  return { imagem: saida, forma }
}

const SOMBRA = 0.04 // folga de cada lado pra sombra caber

// A IA recorta a fruta deixando um contorno claro meio transparente. Encolhe a
// borda 2px e apaga o que sobrar de claro e fraco.
function tirarBordaClara(px, w, h) {
  for (let vez = 0; vez < 2; vez++) {
    const alfa = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) alfa[i] = px[i * 4 + 3]
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!alfa[i]) continue
        const menor = Math.min(alfa[i - 1], alfa[i + 1], alfa[i - w], alfa[i + w])
        if (menor < alfa[i]) px[i * 4 + 3] = menor
      }
    }
  }
  for (let i = 0; i < w * h; i++) {
    const a = px[i * 4 + 3]
    if (a > 0 && a < 200 && px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2] > 600) px[i * 4 + 3] = 0
  }
}

// Formato real da fruta pra física: casca convexa do que é opaco, com no máximo
// 18 pontas. Coordenadas em fração do lado da imagem, centradas no meio.
function contorno(c) {
  const lado = c.width
  const { data } = c.getContext('2d').getImageData(0, 0, lado, lado)
  const passo = Math.max(1, Math.floor(lado / 64))
  const pts = []
  for (let y = 0; y < lado; y += passo) {
    let esq = -1
    let dir = -1
    for (let x = 0; x < lado; x++) {
      if (data[(y * lado + x) * 4 + 3] > 128) {
        if (esq < 0) esq = x
        dir = x
      }
    }
    if (esq >= 0) pts.push([esq, y], [dir, y])
  }
  if (pts.length < 6) return null

  // casca convexa (cadeia monotônica)
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const giro = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const baixo = []
  for (const p of pts) {
    while (baixo.length >= 2 && giro(baixo[baixo.length - 2], baixo[baixo.length - 1], p) <= 0) baixo.pop()
    baixo.push(p)
  }
  const cima = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (cima.length >= 2 && giro(cima[cima.length - 2], cima[cima.length - 1], p) <= 0) cima.pop()
    cima.push(p)
  }
  let casca = baixo.slice(0, -1).concat(cima.slice(0, -1))

  // tira as pontas que menos mudam o desenho até sobrar 18
  const area = (a, b, c2) => Math.abs(giro(a, b, c2))
  while (casca.length > 18) {
    let menor = Infinity
    let qual = 0
    for (let i = 0; i < casca.length; i++) {
      const v = area(casca[(i - 1 + casca.length) % casca.length], casca[i], casca[(i + 1) % casca.length])
      if (v < menor) {
        menor = v
        qual = i
      }
    }
    casca.splice(qual, 1)
  }
  return casca.map(([x, y]) => ({ x: x / lado - 0.5, y: y / lado - 0.5 }))
}

function carregarImagem(caminho) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = `${import.meta.env.BASE_URL}${caminho}`
  })
}

// Carrega as frutas do mundo (só na primeira vez) e passa a usar elas.
// Mundo sem imagem ainda usa as do mundo 1; sem nenhuma, o desenho próprio.
export async function usarMundo(mundo) {
  if (!porMundo[mundo]) {
    const conjunto = { imagens: [], formas: [], daIA: [], temArte: false }
    await Promise.all(
      FRUTAS.map(async (_, i) => {
        let img = await carregarImagem(`frutas/mundo${mundo}/${i}.png`)
        if (img) conjunto.temArte = true
        else if (mundo !== 1) img = await carregarImagem(`frutas/mundo1/${i}.png`)
        if (img) {
          const { imagem, forma } = prepararImagemIA(img)
          conjunto.imagens[i] = imagem
          conjunto.formas[i] = forma
          conjunto.daIA[i] = true
        } else {
          conjunto.imagens[i] = desenhoVetor(i)
        }
      }),
    )
    porMundo[mundo] = conjunto
  }
  ativo = porMundo[mundo]
  mundoAtivo = porMundo[mundo].temArte ? mundo : 1
}

export function nomeDaFruta(nivel) {
  return MUNDOS[mundoAtivo - 1].frutas[nivel]
}

// Tamanho na tela do quadrado onde a fruta está (sem a folga da sombra).
function ladoDaFruta(nivel) {
  return FRUTAS[nivel].raio * 2 * (ativo.daIA[nivel] ? 1.08 : FOLGA)
}

// Pontas do formato real, já no tamanho do jogo; null = usar círculo.
export function formaDaFruta(nivel) {
  const f = ativo.formas[nivel]
  if (!f) return null
  const lado = ladoDaFruta(nivel)
  return f.map((p) => ({ x: p.x * lado, y: p.y * lado }))
}

// Desenha a fruta centrada em (0,0); quem chama faz translate/rotate.
export function desenharFruta(ctx, nivel) {
  const img = ativo.imagens[nivel]
  if (!img) return
  const lado = ladoDaFruta(nivel) * (ativo.daIA[nivel] ? 1 + SOMBRA * 2 : 1)
  ctx.drawImage(img, -lado / 2, -lado / 2, lado, lado)
}

