// Disfarça uma emenda horizontal (linha dura) num mapa já montado, sem desenho novo:
//  1. entorta a faixa de cima aos poucos pra estrada encontrar a de baixo;
//  2. mistura as duas imagens numa faixa fina em volta da linha;
//  3. dos dois lados da estrada, cobre a linha com um retalho de vegetação clonado
//     do próprio mapa (o que melhor encaixa em cima e embaixo), com bordas suaves.
// Uso: node scripts/camuflar-emenda.mjs mapa.png y1 [y2 ...]   (altera o arquivo)
import fs from 'node:fs'
import { PNG } from 'pngjs'

const [arq, ...ys] = process.argv.slice(2)
const img = PNG.sync.read(fs.readFileSync(arq))
const { width: w, height: h } = img
let d = img.data

const k = (x, y) => (y * w + x) * 4
const eTerra = (x, y) => {
  const i = k(x, y)
  const r = d[i], g = d[i + 1], b = d[i + 2]
  return r > 200 && g > 120 && b < 150 && r - b > 75 && r - g < 110
}

// bordas da estrada numa linha: maior trecho de terra perto do palpite
function estrada(y, palpite = w / 2) {
  let melhor = null
  let ini = -1
  for (let x = 0; x <= w; x++) {
    const t = x < w && eTerra(x, y)
    if (t && ini < 0) ini = x
    if (!t && ini >= 0) {
      if (x - ini > 45) {
        const c = (ini + x) / 2
        const nota = x - ini - Math.abs(c - palpite) * 0.8
        if (!melhor || nota > melhor.nota) melhor = { a: ini, b: x - 1, nota }
      }
      ini = -1
    }
  }
  return melhor
}
// mediana das bordas numa faixa de linhas
function estradaFaixa(y0, y1, palpite) {
  const as = [], bs = []
  for (let y = y0; y < y1; y += 2) {
    const e = estrada(y, palpite)
    if (e) {
      as.push(e.a)
      bs.push(e.b)
    }
  }
  if (!as.length) return null
  as.sort((p, q) => p - q)
  bs.sort((p, q) => p - q)
  return { a: as[as.length >> 1], b: bs[bs.length >> 1] }
}

const suave = (t) => t * t * (3 - 2 * t)

for (const yArg of ys) {
  const Y = Number(yArg)
  const cima = estradaFaixa(Y - 30, Y - 4)
  const baixo = estradaFaixa(Y + 4, Y + 30, cima ? (cima.a + cima.b) / 2 : w / 2)
  if (!cima || !baixo) {
    console.log('emenda', Y, ': não achei a estrada dos dois lados, só misturando')
  }

  // 1. entortar: as linhas [Y-H, Y) andam até as bordas de cima virarem as de baixo
  const H = 320
  if (cima && baixo) {
    const orig = Buffer.from(d)
    for (let y = Math.max(0, Y - H); y < Y; y++) {
      const t = suave((y - (Y - H)) / H)
      const pts = [
        [0, 0],
        [cima.a, cima.a + (baixo.a - cima.a) * t],
        [cima.b, cima.b + (baixo.b - cima.b) * t],
        [w - 1, w - 1],
      ]
      for (let x = 0; x < w; x++) {
        // destino x -> origem: inverte o mapeamento por partes
        let j = 1
        while (j < pts.length - 1 && pts[j][1] < x) j++
        const [s0, d0] = pts[j - 1]
        const [s1, d1] = pts[j]
        const sx = Math.max(0, Math.min(w - 1, Math.round(s0 + ((x - d0) / (d1 - d0 || 1)) * (s1 - s0))))
        const o = k(x, y), s = (y * w + sx) * 4
        d[o] = orig[s]; d[o + 1] = orig[s + 1]; d[o + 2] = orig[s + 2]
      }
    }
  }

  // 2. mistura vertical fina: cada linha da faixa vira média ponderada entre a linha
  //    de cima (Y-B-1) e a de baixo (Y+B), o que apaga o degrau de cor
  const B = 14
  {
    const orig = Buffer.from(d)
    for (let y = Y - B; y < Y + B; y++) {
      const t = suave((y - (Y - B)) / (2 * B))
      for (let x = 0; x < w; x++) {
        const o = k(x, y)
        const own = t < 0.5 ? orig : orig
        for (let c = 0; c < 3; c++) {
          const acima = orig[k(x, Y - B - 1) + c]
          const abaixo = orig[k(x, Y + B) + c]
          const linha = own[o + c]
          // perto da linha usa mais o degradê; longe, mantém o desenho
          const quanto = 1 - Math.abs(y - Y) / B
          d[o + c] = linha * (1 - quanto) + (acima * (1 - t) + abaixo * t) * quanto
        }
      }
    }
  }

  // 3. retalhos de vegetação dos dois lados da estrada
  const ref = baixo || cima || { a: w / 2 - 50, b: w / 2 + 50 }
  const PH = 110 // altura do retalho
  const lados = [
    { x0: 0, x1: Math.max(0, Math.min(ref.a, cima ? cima.a : ref.a) - 12) },
    { x0: Math.min(w, Math.max(ref.b, cima ? cima.b : ref.b) + 12), x1: w },
  ]
  for (let { x0, x1 } of lados) {
    const top = Y - PH / 2
    // a água (mar, rio) fica de fora: o retalho para antes da primeira coluna com água
    const colunaAgua = (x) => {
      let n = 0
      for (let yy = top; yy < top + PH; yy += 5) {
        const m = k(x, Math.max(0, Math.min(h - 1, yy)))
        // água é azul-claro (janela azul-escura de casa não conta)
        if (d[m + 2] > 180 && d[m + 1] > 150 && d[m + 2] > d[m] + 40) n++
      }
      return n > PH / 5 / 4
    }
    if (x0 > 0) {
      for (let x = x0; x < x1; x++) if (colunaAgua(x)) { x1 = Math.max(x0, x - 8); break }
    } else {
      for (let x = x1 - 1; x > x0; x--) if (colunaAgua(x)) { x0 = Math.min(x1, x + 8); break }
    }
    if (x1 - x0 < 30) continue
    // lado com água (rio, cachoeira, mar): não cobre, senão interrompe a água
    let agua = 0, tot = 0
    for (let yy = top; yy < top + PH; yy += 6)
      for (let x = x0; x < x1; x += 6) {
        const m = k(x, yy)
        if (d[m + 2] > d[m] + 30) agua++
        tot++
      }
    if (agua / tot > 0.25) continue
    // procura a origem que melhor encaixa nas linhas logo acima e logo abaixo do retalho
    let best = null
    for (let sy = 200; sy < h - PH - 1; sy += 7) {
      if (Math.abs(sy - top) < PH * 2) continue
      for (const dx of [0]) {
        let e = 0, n = 0
        for (let x = x0; x < x1; x += 4) {
          for (const [dy, ly] of [[0, top - 1], [PH - 1, top + PH]]) {
            if (ly < 0 || ly >= h) continue
            const a = k(x, sy + dy), b = k(x + dx, ly)
            e += Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2])
            n++
          }
          // evita clonar casa (telhado/parede), estrada ou mar: olha o retalho inteiro
          for (let yy = 6; yy < PH; yy += 12) {
            const m = k(x, sy + yy)
            const r = d[m], g = d[m + 1], bl = d[m + 2]
            if (r > 190 && g < 140 && bl < 110) e += 60 // telhado
            if (r > 215 && g > 205 && bl > 195) e += 60 // parede branca
            if (bl > r + 30) e += 60 // água
            if (eTerra(x, sy + yy)) e += 40 // estrada
          }
        }
        const v = e / n
        if (!best || v < best.v) best = { v, sy }
      }
    }
    const orig = Buffer.from(d)
    for (let y = 0; y < PH; y++) {
      const ty = top + y
      if (ty < 0 || ty >= h) continue
      const av = suave(Math.min(1, Math.min(y, PH - 1 - y) / 28)) // some em cima e embaixo
      for (let x = x0; x < x1; x++) {
        const ah = suave(Math.min(1, Math.min(x - x0 + (x0 === 0 ? 99 : 0), x1 - x + (x1 === w ? 99 : 0)) / 22))
        const a = av * ah
        const o = k(x, ty), s = k(x, best.sy + y)
        for (let c = 0; c < 3; c++) d[o + c] = orig[o + c] * (1 - a) + orig[s + c] * a
      }
    }
  }
  console.log('emenda', Y, cima && baixo ? `estrada ${cima.a}-${cima.b} -> ${baixo.a}-${baixo.b}` : '')
}

fs.writeFileSync(arq, PNG.sync.write(img))
