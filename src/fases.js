// Gera qualquer fase a partir do número dela. A mesma fase sempre sai igual.
// Cada fase combina: um tipo de meta, um formato de pote, às vezes tempo,
// e a cada 10 uma fase chefe. Fases vizinhas nunca repetem a combinação.

import { FRUTAS } from './frutas.js'
import { FRUTAS_CALIBRADAS } from './calibragem.js'

const LARGURA_POTE = 330

function sorteador(semente) {
  let s = semente * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export const FASES_POR_MUNDO = 30
export const TOTAL_FASES = 120 // 4 mundos

export function mundoDaFase(n) {
  return Math.min(4, Math.floor((n - 1) / FASES_POR_MUNDO) + 1)
}

// ordem das metas; as 5 primeiras fases são só "criar" pra pessoa aprender
const CICLO_METAS = ['criar', 'juntar', 'criar', 'combo', 'criar', 'quebrar']
const CICLO_FORMATOS = ['normal', 'degrau', 'estreito', 'funil']

// quanto vale em "uvas" cada fruta que cai, em média
function mediaUvas(maiorQueCai) {
  let m = 0
  for (let k = 0; k <= maiorQueCai; k++) m += 2 ** k / (maiorQueCai + 1)
  return m
}

// opcoes.cru: ignora a calibragem (usado pelo próprio calibrador)
export function gerarFase(n, opcoes = {}) {
  const sorte = sorteador(n)
  const bloco = Math.floor((n - 1) / 5)
  const posNoBloco = (n - 1) % 5
  const chefe = n % 10 === 0
  const tempo = !chefe && n >= 8 && n % 7 === 3 ? 60 : 0
  let formato = n >= 6 ? CICLO_FORMATOS[n % CICLO_FORMATOS.length] : 'normal'

  // primeiras fases ensinam aos poucos: cada uma com uma novidade
  const INICIO = { 1: ['criar', 2], 2: ['criar', 3], 3: ['juntar'], 4: ['criar', 3], 5: ['criar', 4] }
  let tipo = INICIO[n] ? INICIO[n][0] : chefe ? 'criar' : CICLO_METAS[(n - 6) % CICLO_METAS.length]
  if (tipo === 'quebrar' && n < 22) tipo = 'juntar' // caixote só existe a partir da 22

  // meta de "criar": limão no começo, até pêssego; depois da 40 alterna
  const alvoBase = bloco >= 8 ? 5 + (bloco % 2) : Math.min(6, 3 + Math.floor(bloco / 2))
  // a maior meta é o pêssego (6): o abacaxi pra cima não cabe no pote com o que precisa juntar
  let alvo = INICIO[n]?.[1] ?? (chefe ? Math.min(6, alvoBase + 1) : alvoBase)
  let qtd = (bloco >= 8 && alvo === 5) || (n >= 12 && posNoBloco === 4 && alvo <= 5) ? 2 : 1
  if (chefe) qtd = 1

  // pote estreito não tem espaço pra montar um pêssego
  if (formato === 'estreito' && tipo === 'criar' && alvo >= 6) formato = 'degrau'

  let meta
  let maiorQueCai
  let frutas
  if (tipo === 'criar') {
    maiorQueCai = Math.max(1, Math.min(3, alvo - 2))
    const folga = chefe ? 1.6 : Math.max(1.3, 2.6 - posNoBloco * 0.12 - Math.min(bloco, 10) * 0.1)
    frutas = Math.ceil(((2 ** alvo * qtd) / mediaUvas(maiorQueCai)) * folga)
    meta = { tipo, alvo, qtd }
  } else if (tipo === 'juntar') {
    const vezes = n === 3 ? 6 : 10 + Math.min(bloco, 10)
    maiorQueCai = 2
    frutas = Math.ceil(vezes * 1.5) + 2
    meta = { tipo, vezes }
  } else if (tipo === 'combo') {
    maiorQueCai = 1
    frutas = 26
    meta = { tipo, vezes: n < 40 ? 3 : 4 }
  } else {
    maiorQueCai = 2
    frutas = 24
    meta = { tipo, vezes: n >= 60 ? 3 : 2 }
  }
  if (tempo) frutas += 4
  if (!opcoes.cru && FRUTAS_CALIBRADAS[n]) frutas = FRUTAS_CALIBRADAS[n]

  // obstáculos: vão aparecendo tipos novos conforme avança
  //  tabua: parada, inclinada | trampolim: joga a fruta pra cima
  //  caixote: quebra depois de 3 batidas | helice: gira sem parar
  const tipos = ['tabua']
  if (n >= 15) tipos.push('trampolim')
  if (n >= 22) tipos.push('caixote')
  if (n >= 35) tipos.push('helice')
  const obstaculos = []
  const novo = (t, i, y) => ({
    tipo: t,
    x: 85 + sorte() * 160,
    y,
    largura: t === 'caixote' ? 72 : t === 'helice' ? 130 : 70 + sorte() * 40,
    angulo: t === 'tabua' ? (sorte() - 0.5) * 0.7 : 0,
    giro: (sorte() < 0.5 ? -1 : 1) * 0.025,
  })
  if (tipo === 'quebrar') {
    // caixotes espalhados: a meta é quebrar todos
    for (let i = 0; i < meta.vezes; i++) {
      const c = novo('caixote', i, 260 + i * 90)
      c.x = 70 + ((i * 97 + n * 31) % 190)
      obstaculos.push(c)
    }
  } else if (n >= 8 || n === 4) {
    // pote com formato diferente deixa menos espaço: só 1 obstáculo, mais pra cima
    const quantos = formato !== 'normal' ? 1 : n >= 60 ? 3 : n >= 25 ? 2 : 1
    for (let i = 0; i < quantos; i++) {
      const t = i === 0 && [15, 22, 35].includes(n) ? tipos[tipos.length - 1] : tipos[Math.floor(sorte() * tipos.length)]
      obstaculos.push(novo(t, i, formato !== 'normal' ? 250 : 300 + i * 100 + sorte() * 50))
    }
  }

  // tábuas fixas que mudam o formato do pote. O vão nunca é menor que a maior
  // fruta que pode aparecer na fase (com folga), senão a fase vira impossível.
  const maiorNivel = tipo === 'criar' ? alvo : Math.min(FRUTAS.length - 1, maiorQueCai + 4)
  const vaoMinimo = FRUTAS[maiorNivel].raio * 2 * 1.1 + 30
  const paredes = montarParedes(formato, vaoMinimo, n % 2 ? 1 : -1)

  return { n, mundo: mundoDaFase(n), meta, alvo, qtd, frutas, maiorQueCai, obstaculos, paredes, formato, tempo, chefe, vaoMinimo }
}

function montarParedes(formato, vao, lado) {
  if (formato === 'estreito') {
    // colunas de madeira maciça grudadas nas paredes: não sobra corredor
    // entre a tábua e o pote onde a fruta possa ficar presa
    const meio = Math.min(LARGURA_POTE - 40, Math.max(vao, 240))
    const grossura = (LARGURA_POTE - meio) / 2
    if (grossura < 14) return []
    return [
      { x: grossura / 2, y: 430, largura: 300, angulo: Math.PI / 2, grossura },
      { x: LARGURA_POTE - grossura / 2, y: 430, largura: 300, angulo: Math.PI / 2, grossura },
    ]
  }
  if (formato === 'funil') {
    // cada tábua desce da parede até a borda do vão
    const ang = 0.45
    const borda = (LARGURA_POTE - vao) / 2
    if (borda < 50) return []
    const comprimento = borda / Math.cos(ang)
    const cx = borda / 2
    return [
      { x: cx, y: 360, largura: comprimento, angulo: ang },
      { x: LARGURA_POTE - cx, y: 360, largura: comprimento, angulo: -ang },
    ]
  }
  if (formato === 'degrau') {
    const comprimento = Math.min(120, LARGURA_POTE - vao)
    if (comprimento < 50) return []
    return [{ x: lado > 0 ? LARGURA_POTE - comprimento / 2 : comprimento / 2, y: 400, largura: comprimento, angulo: lado * -0.25 }]
  }
  return []
}

export function contarEstrelas(fase, sobraram) {
  const parte = sobraram / fase.frutas
  if (parte >= 0.3) return 3
  if (parte >= 0.12) return 2
  return 1
}
