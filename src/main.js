import './estilo.css'
import { gerarFase, contarEstrelas, mundoDaFase, TOTAL_FASES, FASES_POR_MUNDO } from './fases.js'
import { FRUTAS, MUNDOS, usarMundo, nomeDaFruta, desenharFruta } from './frutas.js'
import * as mapaMundo1 from './mapas/mundo1.js'
import * as mapaMundo2 from './mapas/mundo2.js'

// mapas desenhados (imagem + estrada); mundo sem entrada aqui usa o mapa antigo
const MAPAS = { 1: mapaMundo1, 2: mapaMundo2 }
import { progresso } from './progresso.js'
import { Partida } from './partida.js'
import { som } from './som.js'
import { talvezIntersticial, videoPremiado } from './anuncios.js'
import { animarBau } from './bau.js'
import { animarMascote } from './mascote-anim.js'
import { animarFundo } from './fundo-vivo.js'
import { montarLoja } from './loja.js'
import { ESTRELAS_DO_MUNDO, ESTRELAS_POR_BAU, PRECOS, PODERES, FASES_COM_BONUS, poder, sortearBau } from './economia.js'

const $ = (id) => document.getElementById(id)
const FRUTAS_DO_VIDEO = 5
const CORES_LOGO = ['#ffd23f', '#ff5ea8', '#4dd2ff', '#7dff6a', '#ff9a1f', '#c9a6ff']
let partida = null

// ---------- navegação ----------
function mostrar(tela) {
  for (const id of ['inicio', 'mapa', 'jogo', 'loja']) $(id).classList.toggle('escondida', id !== tela)
  document.querySelectorAll('.qtd-moedas').forEach((el) => (el.textContent = progresso.moedas))
  document.querySelectorAll('.qtd-estrelas').forEach((el) => (el.textContent = progresso.totalEstrelas()))
}

function sairDaPartida() {
  if (partida) partida.encerrar()
  partida = null
  fecharModal()
}

function iconeFruta(nivel, tam = 60) {
  const c = document.createElement('canvas')
  c.width = c.height = tam
  const ctx = c.getContext('2d')
  const escala = tam / (FRUTAS[nivel].raio * 2.4)
  ctx.translate(tam / 2, tam / 2 + tam * 0.05)
  ctx.scale(escala, escala)
  desenharFruta(ctx, nivel)
  return c
}

// ---------- menu inicial ----------
async function abrirInicio() {
  sairDaPartida()
  await usarMundo(mundoDaFase(Math.min(progresso.liberada, TOTAL_FASES)))
  desenharVitrine()
  $('jogar-fase').textContent = `Fase ${Math.min(progresso.liberada, TOTAL_FASES)}`
  $('badge-premio').classList.toggle('escondida', !progresso.premioDiarioDisponivel())
  const prontos = progresso.bausProntos(ESTRELAS_POR_BAU)
  $('badge-bau').textContent = prontos
  $('badge-bau').classList.toggle('escondida', prontos <= 0)
  $('progresso-bau').style.width = prontos > 0 ? '100%' : `${((progresso.totalEstrelas() % ESTRELAS_POR_BAU) / ESTRELAS_POR_BAU) * 100}%`
  mostrar('inicio')
}

function montarInicio() {
  // cada letra de uma cor, balançando fora de compasso
  let atraso = 0
  $('logo').innerHTML = ['Juntar', 'Frutas']
    .map(
      (palavra) =>
        `<span class="linha">${[...palavra]
          .map((l, i) => {
            atraso += 0.12
            return `<span class="letra" style="color:${CORES_LOGO[(i + palavra.length) % CORES_LOGO.length]};animation-delay:-${atraso}s">${l}</span>`
          })
          .join('')}</span>`,
    )
    .join('')

  document.querySelector('.brilhos').innerHTML = Array.from(
    { length: 14 },
    (_, i) =>
      `<i style="left:${(i * 37) % 95}%;top:${(i * 53) % 90}%;animation-delay:-${(i * 0.37) % 2.2}s;transform:scale(${0.6 + (i % 3) * 0.3})"></i>`,
  ).join('')
}

// Menu: cenário do mundo atual ao fundo.
const macaco = animarMascote($('mascote-menu'), { aoTocar: () => som.combo(2) })
animarFundo($('fundo-vivo'))

function desenharVitrine() {
  const mundo = mundoDaFase(Math.min(progresso.liberada, TOTAL_FASES))
  macaco.usarPose(mundo > 1 ? `mundo${mundo}` : 'feliz', ['aponta'])
  $('inicio').style.setProperty('--fundo', `url(/fundos/${mundo === 1 ? 'menu' : 'jogo'}-${mundo}.jpg)`)
}

// Jogar abre o mapa; a pessoa escolhe a fase lá
$('jogar').onclick = abrirMapa
$('abrir-config').onclick = abrirConfig

async function abrirConfig() {
  const chave = (id, ligado, icone, nome) => `<button class="opcao" data-acao="${id}">
      <img src="/icones/${icone}.svg" alt=""><span>${nome}</span>
      <i class="chave${ligado ? ' ligada' : ''}"><i></i></i></button>`
  abrirModal(`<div class="fita azul">Configurações</div>
    ${chave('som', som.ligado, som.ligado ? 'som' : 'mudo', 'Sons')}
    ${chave('vibrar', som.vibra, 'vibrar', 'Vibração')}
    <button class="opcao" data-acao="como"><img src="/icones/mapa.svg" alt=""><span>Como jogar</span><b>›</b></button>
    <button class="btn principal" data-acao="fechar">Pronto</button>
    <p class="versao">Versão 0.1 · teste</p>`)
  const acao = await esperarAcao()
  if (acao === 'som') som.alternar()
  else if (acao === 'vibrar') som.alternarVibrar()
  else if (acao === 'como') {
    abrirModal(`<div class="fita verde">Como jogar</div>
      <img class="mascote-modal" src="/mascote/aponta.png" alt="">
      <p class="texto-ajuda">Toque no pote pra soltar a fruta.<br>Duas frutas <b>iguais</b> que se encostam viram a <b>próxima</b>, maior.<br>
      Faça a fruta da <b>meta</b> antes de acabarem as frutas, sem deixar o pote passar da linha.<br>
      Sobrou fruta? Mais <b>estrelas</b>. Estrelas abrem <b>baús</b> e <b>mundos novos</b>.</p>
      <button class="btn principal" data-acao="ok">Entendi</button>`)
    await esperarAcao()
  }
  if (acao !== 'fechar') return abrirConfig()
}
$('abrir-bau').onclick = async () => {
  if (progresso.bausProntos(ESTRELAS_POR_BAU) <= 0) {
    const tem = progresso.totalEstrelas() % ESTRELAS_POR_BAU
    const estrela = '<img class="ico-estrela" src="/icones/estrela.svg" alt="">'
    abrirModal(`<div class="fita azul">Baú de estrelas</div>
      <div class="grande"><img src="/icones/bau-fechado.png" alt="" style="width:96px"></div>
      <p>A cada <b>${ESTRELAS_POR_BAU} ${estrela}</b> que você junta nas fases, um baú abre com moedas e power-ups.</p>
      <div class="barra-progresso"><i style="width:${(tem / ESTRELAS_POR_BAU) * 100}%"></i><b>${tem} / ${ESTRELAS_POR_BAU} ${estrela}</b></div>
      <button class="btn principal" data-acao="jogar">Jogar</button>`)
    if ((await esperarAcao()) === 'jogar') abrirMapa()
    return
  }
  const premio = sortearBau(progresso.liberada)
  progresso.abrirBau(premio)
  await animarBau(premio)
  abrirInicio()
}

$('abrir-loja').onclick = abrirLoja

function abrirLoja() {
  mostrar('loja')
  montarLoja($('loja-conteudo'), { aoMudar: abrirLoja })
}

$('abrir-premio').onclick = async () => {
  if (!progresso.premioDiarioDisponivel()) {
    abrirModal(`<div class="fita azul">Prêmio diário</div>
      <img class="mascote-modal" src="/mascote/dorme.png" alt=""><p>Você já pegou o prêmio de hoje. Amanhã tem mais!</p>
      <button class="btn principal" data-acao="ok">Beleza</button>`)
    await esperarAcao()
    return
  }
  const ganho = progresso.pegarPremioDiario()
  som.vitoria()
  abrirModal(`<div class="fita verde">Prêmio diário</div>
    <div class="grande"><img src="/icones/presente.png" alt="" style="width:96px"></div><div class="ganho"><img class="ico-moeda" src="/icones/moeda.svg" alt=""> +${ganho}</div>
    <p>Amanhã tem outro presente te esperando.</p>
    <button class="btn principal" data-acao="ok">Pegar</button>`)
  await esperarAcao()
  abrirInicio()
}
document.querySelectorAll('[data-ir]').forEach((b) => {
  b.onclick = () => (b.dataset.ir === 'mapa' ? abrirMapa() : abrirInicio())
})

// ---------- mapa ----------
function abrirMapa() {
  sairDaPartida()
  mostrar('mapa')
  const trilha = $('trilha')
  const largura = trilha.clientWidth || 360
  // mostra até 9 fases à frente; num mundo com mapa desenhado, o mundo inteiro
  let ate = Math.min(TOTAL_FASES, progresso.liberada + 9)
  const mundoFim = mundoDaFase(ate)
  if (MAPAS[mundoFim]) ate = Math.min(TOTAL_FASES, mundoFim * FASES_POR_MUNDO)
  const passo = 120
  const respiro = 150 // espaço a mais onde muda de mundo, pra caber a faixa

  // cada mundo é um trecho do mapa, de baixo pra cima. Mundo com mapa desenhado
  // (imagem + estrada) usa a imagem inteira e as fases ficam em cima da estrada.
  const ultimoMundo = mundoDaFase(ate)
  const trechos = []
  for (let m = 1; m <= ultimoMundo; m++) {
    const desenho = MAPAS[m]
    const primeira = (m - 1) * FASES_POR_MUNDO + 1
    const ultima = Math.min(ate, m * FASES_POR_MUNDO)
    const alturaTrecho = desenho ? largura * desenho.PROPORCAO : (ultima - primeira + 1) * passo + respiro
    trechos.push({ m, desenho, primeira, ultima, alturaTrecho })
  }
  const altura = trechos.reduce((s, t) => s + t.alturaTrecho, 0) + 40
  trilha.style.height = `${altura}px`
  trilha.style.setProperty('--tile', `${(largura * 1920) / 1080}px`)

  const pontos = []
  let html = ''
  let base = altura
  for (const t of trechos) {
    const topo = base - t.alturaTrecho
    if (t.desenho) {
      // botões do tamanho da estrada (um pouco menos, pra ver a calçada dos dois lados)
      trilha.style.setProperty('--estrada', `${Math.max(38, t.desenho.LARGURA_ESTRADA * largura * 0.95)}px`)
      html += `<div class="secao-mundo desenhado" style="top:${topo}px;height:${t.alturaTrecho}px;background-image:url(/mapa/mundo-${t.m}.jpg?v=${t.desenho.VERSAO})"></div>`
      for (let n = t.primeira; n <= t.ultima; n++) {
        const [fx, fy] = t.desenho.PONTOS[n - t.primeira]
        pontos.push({ n, x: fx * largura, y: topo + fy * t.alturaTrecho, desenhado: true })
      }
    } else {
      html += `<div class="secao-mundo" style="top:${topo}px;height:${t.alturaTrecho}px;background-image:url(/fundos/mapa-${t.m}.jpg)"></div>`
      for (let n = t.primeira; n <= t.ultima; n++) {
        const y = base - respiro / 2 - (n - t.primeira + 0.5) * passo
        pontos.push({ n, x: largura / 2 + Math.sin(n * 1.1) * largura * 0.24, y })
      }
    }
    if (t.m > 1) t.faixaY = base
    base = topo
  }

  // estradinha ligando as fases
  const semDesenho = pontos.filter((p) => !p.desenhado)
  const caminho = semDesenho.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  html += `<svg viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="none">
    <path d="${caminho}" stroke="rgba(60,30,5,.45)" stroke-width="40" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${caminho}" stroke="#f6dfa8" stroke-width="30" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${caminho}" stroke="#fff" stroke-width="5" fill="none" stroke-dasharray="10 14" stroke-linecap="round" opacity=".8"/>
  </svg>`

  for (const p of pontos) {
    if (p.n > 1 && (p.n - 1) % FASES_POR_MUNDO === 0) {
      const m = mundoDaFase(p.n)
      const trancado = progresso.totalEstrelas() < ESTRELAS_DO_MUNDO[m]
      const y = trechos[m - 1].faixaY
      html += `<div class="faixa-mapa" style="top:${y}px"><img src="/faixas/mundo${m}.png" alt="Mundo ${m}: ${MUNDOS[m - 1].nome}">
        ${trancado ? `<span class="precisa">🔒 precisa ${ESTRELAS_DO_MUNDO[m]} <img class="ico-estrela" src="/icones/estrela.svg" alt=""></span>` : ''}</div>`
    }
    const trancado = p.n > progresso.liberada
    const atual = p.n === progresso.liberada
    const est = progresso.estrelasDa(p.n)
    const estrelas = est
      ? `<span class="est">${[1, 2, 3].map((i) => `<span class="${i <= est ? '' : 'off'}"><img class="ico-estrela" src="/icones/estrela.svg" alt=""></span>`).join('')}</span>`
      : ''
    const tipo = trancado ? 'trancada' : atual ? 'atual' : 'aberta'
    html += `<button class="no ${tipo}${p.desenhado ? ' compacto' : ''}" data-n="${p.n}" style="left:${p.x}px;top:${p.y}px;background-image:url(/mapa/fase-${tipo === 'aberta' ? 'feita' : tipo}.png)">
      ${trancado ? '' : `<b>${p.n}</b>`}${estrelas}${atual ? '<span class="pino"></span>' : ''}</button>`
  }
  trilha.innerHTML = html
  trilha.querySelectorAll('.no:not(.trancada)').forEach((b) => (b.onclick = () => abrirFase(Number(b.dataset.n))))
  trilha.querySelector('.atual')?.scrollIntoView({ block: 'center' })

  // faixa do topo mostra o mundo que está no meio da tela e troca na hora ao rolar
  const rolagem = trilha.parentElement
  const secoes = [...trilha.querySelectorAll('.secao-mundo')]
  const faixa = $('mundo-atual')
  const atualizarFaixa = () => {
    const meio = rolagem.scrollTop + rolagem.clientHeight / 2
    const i = secoes.findIndex((el) => meio >= el.offsetTop && meio < el.offsetTop + el.offsetHeight)
    const m = i >= 0 ? i + 1 : 1
    if (faixa.dataset.mundo === String(m)) return
    faixa.dataset.mundo = m
    faixa.src = `/faixas/mundo${m}.png`
    faixa.classList.remove('troca')
    void faixa.offsetWidth
    faixa.classList.add('troca')
  }
  rolagem.onscroll = atualizarFaixa
  atualizarFaixa()
}

// Primeira vez num mundo: mostra as frutas novas, da menor pra maior.
async function apresentarMundo(m) {
  chuvaDeConfete()
  som.vitoria()
  abrirModal(`<img class="faixa-mundo" src="/faixas/mundo${m}.png" alt="Mundo ${m}: ${MUNDOS[m - 1].nome}">
    <img class="mascote-modal" src="/mascote/surpreso.png" alt="">
    <p>Frutas novas desbloqueadas!</p>
    <div class="vitrine-mundo" id="vitrine-mundo"></div>
    <button class="btn principal" data-acao="ok">Bora!</button>`)
  const caixa = $('vitrine-mundo')
  FRUTAS.forEach((_, i) => {
    const item = document.createElement('div')
    item.style.animationDelay = `${i * 0.08}s`
    item.append(iconeFruta(i, 96))
    const nome = document.createElement('small')
    nome.textContent = nomeDaFruta(i)
    item.append(nome)
    caixa.append(item)
  })
  await esperarAcao()
}

// ---------- jogo ----------
async function abrirFase(n) {
  sairDaPartida()
  const fase = gerarFase(n)
  const precisa = ESTRELAS_DO_MUNDO[fase.mundo]
  if (progresso.totalEstrelas() < precisa) {
    abrirModal(`<div class="fita azul">Mundo ${fase.mundo}: ${MUNDOS[fase.mundo - 1].nome}</div>
      <img class="mascote-modal" src="/mascote/pensa.png" alt="">
      <p>Pra entrar neste mundo você precisa de <b>${precisa} <img class="ico-estrela" src="/icones/estrela.svg" alt=""></b>. Você tem ${progresso.totalEstrelas()}.
      As fases antigas ainda guardam estrelas escondidas.</p>
      <button class="btn principal" data-acao="mapa">Ver mapa</button>`)
    await esperarAcao()
    return abrirMapa()
  }
  await usarMundo(fase.mundo)
  if (!progresso.viuMundo(fase.mundo)) {
    progresso.marcarMundo(fase.mundo)
    if (fase.mundo > 1) await apresentarMundo(fase.mundo)
  }
  faseAberta = n
  $('hud-fase').textContent = `Fase ${n}`
  // o pote aparece limpo atrás do cartão, sem as frutas da fase anterior
  $('tela').getContext('2d').clearRect(0, 0, $('tela').width, $('tela').height)
  $('tela').className = `pote-${progresso.pote}`
  $('jogo').style.setProperty('--fundo', `url(/fundos/jogo-${fase.mundo}.jpg)`)
  $('hud-fase').textContent = fase.chefe ? `Fase chefe ${n}` : `Fase ${n}`
  montarMeta($('hud-meta'), fase.meta)
  $('hud-restam').textContent = fase.frutas
  montarSequencia(fase)
  desenharDepois(null)
  atualizarPoderes()
  mostrar('jogo')
  await apresentarPoderesNovos(n)
  atualizarPoderes()
  await apresentarFase(fase)
  partida = new Partida($('tela'), fase, {
    mudou: atualizarHud,
    venceu,
    perdeu,
    festejou: () => reagirMascote('comemora'),
    usouFerramenta: (nome) => {
      progresso.gastar(nome + 's')
      atualizarPoderes()
    },
  })
  if (import.meta.env.DEV) window.partida = partida
  avisouPoucas = false
  reagirMascote('oi')
  atualizarHud(partida)
  atualizarPoderes()
}

const NOMES_FORMATO = { estreito: 'Pote estreito', degrau: 'Pote com degrau', funil: 'Pote com funil' }

// Texto da meta, com o ícone da fruta quando for "criar".
function montarMeta(el, meta, progressoMeta) {
  el.innerHTML = ''
  const conta = progressoMeta ? ` ${progressoMeta.feito}/${progressoMeta.total}` : ''
  if (meta.tipo === 'criar') {
    el.append(meta.qtd > 1 ? `Crie ${meta.qtd} ` : 'Crie ')
    el.append(iconeFruta(meta.alvo), nomeDaFruta(meta.alvo))
    if (meta.qtd > 1 && progressoMeta) el.append(conta)
  } else if (meta.tipo === 'juntar') el.append(progressoMeta ? `Junte frutas:${conta}` : `Junte frutas ${meta.vezes} vezes`)
  else if (meta.tipo === 'combo') el.append(progressoMeta ? `Combo x${meta.vezes}` : `Faça um combo x${meta.vezes}`)
  else el.append(progressoMeta ? `Quebre caixotes:${conta}` : `Quebre ${meta.vezes} caixotes`)
}

function atualizarHud(p) {
  montarMeta($('hud-meta'), p.fase.meta, p.progressoMeta())
  const n = p.fase.n
  let titulo = p.fase.chefe ? `Fase chefe ${n}` : `Fase ${n}`
  if (p.tempoRestante !== null) {
    const seg = Math.max(0, Math.ceil(p.tempoRestante / 60))
    titulo += ` · ⏱ ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`
    $('hud-fase').classList.toggle('urgente', seg <= 10)
  } else $('hud-fase').classList.remove('urgente')
  $('hud-fase').textContent = titulo
  $('hud-restam').textContent = p.restam
  $('hud-restam').parentElement.classList.toggle('pouco', p.restam <= 3)
  desenharDepois(p.restam > 1 ? p.depois : null)
  if (p.restam === 3 && !avisouPoucas && p.estado === 'jogando') {
    avisouPoucas = true
    reagirMascote('surpreso')
  }
}

// Macaquinho espia pela lateral da fase: dá oi no começo, comemora combos e frutas grandes
// e se surpreende quando sobram poucas frutas. Entra, fica um pouquinho e sai.
const POSES_FASE = { oi: '/mascote/hd/feliz.png', comemora: '/mascote/comemora.png', surpreso: '/mascote/surpreso.png' }
let avisouPoucas = false
let mascoteOcupado = 0
function reagirMascote(pose) {
  const el = $('mascote-fase')
  const agora = performance.now()
  if (agora < mascoteOcupado) return
  mascoteOcupado = agora + 2600
  el.src = POSES_FASE[pose]
  el.className = 'mascote-fase'
  void el.offsetWidth // reinicia a animação
  el.classList.add('aparece', pose === 'oi' ? 'esquerda' : Math.random() < 0.5 ? 'esquerda' : 'direita')
}

// Fruta que vem depois da que está na mão, pra dar pra planejar.
function desenharDepois(nivel) {
  const c = $('hud-depois')
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  c.parentElement.classList.toggle('vazio', nivel === null)
  if (nivel === null) return
  ctx.save()
  ctx.translate(c.width / 2, c.height / 2 + 3)
  ctx.scale(c.width / (FRUTAS[nivel].raio * 2.6), c.width / (FRUTAS[nivel].raio * 2.6))
  desenharFruta(ctx, nivel)
  ctx.restore()
}

// Fileira com a ordem das frutas do mundo: duas iguais viram a da direita.
// A fruta da meta fica destacada; as que passam dela ficam apagadinhas.
function montarSequencia(fase) {
  const el = $('hud-sequencia')
  el.innerHTML = ''
  const alvo = fase.meta.tipo === 'criar' ? fase.meta.alvo : null
  FRUTAS.forEach((_, nivel) => {
    const item = document.createElement('span')
    item.className = 'elo' + (nivel === alvo ? ' alvo' : '') + (alvo !== null && nivel > alvo ? ' alem' : '')
    item.append(iconeFruta(nivel, 64))
    el.append(item)
  })
}

// Cartão que entra antes da fase: número, meta e o que ela tem de diferente.
function apresentarFase(fase) {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    el.className = 'apresenta-fase' + (fase.chefe ? ' chefe' : '')
    const extras = [
      fase.chefe ? '<span class="tag chefe">Fase chefe · prêmio em dobro</span>' : '',
      fase.tempo ? `<span class="tag tempo">⏱ ${fase.tempo} segundos</span>` : '',
      NOMES_FORMATO[fase.formato] ? `<span class="tag">${NOMES_FORMATO[fase.formato]}</span>` : '',
    ].join('')
    el.innerHTML = `<div class="cartao-fase">
        <img class="mascote-apresenta" src="/mascote/${fase.chefe ? 'surpreso' : 'aponta'}.png" alt="">
        <div class="numero-fase">${fase.chefe ? 'Chefe!' : 'Fase ' + fase.n}</div>
        <div class="meta-fase"></div>
        <div class="tags">${extras}</div>
        <div class="ensina"></div>
        <small>toque pra começar</small>
      </div>`
    montarMeta(el.querySelector('.meta-fase'), fase.meta)
    montarEnsino(el.querySelector('.ensina'), fase)
    document.body.appendChild(el)
    som.combo(2)
    let foi = false
    const sair = () => {
      if (foi) return
      foi = true
      el.classList.add('saindo')
      setTimeout(() => {
        el.remove()
        resolve()
      }, 350)
    }
    // espera o toque: se sumisse sozinho, o toque do jogador caía no pote e gastava uma fruta
    el.onclick = sair
  })
}

const ENSINO_OBSTACULO = {
  tabua: 'Novidade: tábua! As frutas escorregam por ela.',
  trampolim: 'Novidade: cogumelo! Ele joga a fruta pra cima.',
  caixote: 'Novidade: caixote! Três batidas fortes e ele quebra.',
  helice: 'Novidade: hélice! Ela gira sem parar.',
}

// Fase em que cada obstáculo aparece pela primeira vez (calculado uma vez só).
let estreiaObstaculo = null
function estreias() {
  if (estreiaObstaculo) return estreiaObstaculo
  estreiaObstaculo = {}
  for (let n = 1; n <= TOTAL_FASES; n++) {
    for (const o of gerarFase(n).obstaculos) estreiaObstaculo[o.tipo] ??= n
  }
  return estreiaObstaculo
}

// O que o cartão ensina: na fase 1, como juntar e mirar; depois, cada obstáculo novo.
function montarEnsino(el, fase) {
  if (fase.n === 1) {
    const conta = document.createElement('div')
    conta.className = 'conta'
    conta.append(iconeFruta(0, 72), '+', iconeFruta(0, 72), '=', iconeFruta(1, 72))
    const p = document.createElement('p')
    p.textContent = 'Duas iguais viram uma maior. Arrastando o dedo, você escolhe onde ela cai.'
    el.append(conta, p)
    return
  }
  const novos = [...new Set(fase.obstaculos.map((o) => o.tipo))].filter((t) => estreias()[t] === fase.n)
  for (const t of novos) {
    const p = document.createElement('p')
    p.textContent = ENSINO_OBSTACULO[t]
    el.append(p)
  }
}

// Botões de power-up embaixo do pote: só aparecem os já liberados até a fase aberta.
let faseAberta = 1
function atualizarPoderes() {
  for (const b of document.querySelectorAll('.poder[data-poder]')) {
    const p = poder(b.dataset.poder)
    const qtd = progresso[p.id]
    b.classList.toggle('escondida', faseAberta < p.libera)
    const badge = b.querySelector('.badge')
    badge.textContent = qtd > 0 ? qtd : '▶'
    badge.classList.toggle('video', qtd <= 0)
    b.classList.toggle('ativo', !!partida?.ferramenta && partida.ferramenta + 's' === p.id)
  }
  const visiveis = document.querySelectorAll('.poder[data-poder]:not(.escondida)').length
  document.querySelector('.poderes').classList.toggle('cheio', visiveis > 2)
  const armado = partida?.ferramenta
  $('dica-martelo').textContent = armado ? poder(armado + 's').dica : ''
  $('dica-martelo').classList.toggle('escondida', !armado)
}

// Sem estoque? Oferece vídeo pra ganhar mais um.
async function garantirPoder(item) {
  if (progresso[item] > 0) return true
  const p = poder(item)
  abrirModal(`<div class="fita azul">${p.nome}</div>
    <div class="grande"><img src="${p.icone}" alt="" style="width:90px"></div><p>Acabou! Que tal um vídeo curtinho pra ganhar mais 1?</p>
    <button class="btn video" data-acao="video"><img class="ico-video" src="/icones/video.png" alt=""> Ver vídeo</button>
    <button class="btn secundario" data-acao="nao">Agora não</button>`)
  if ((await esperarAcao()) !== 'video') return false
  if (!(await videoPremiado())) return false
  progresso.ganhar(item, 1)
  atualizarPoderes()
  return true
}

// Poder novo liberado nesta fase: aviso com presente antes de começar.
async function apresentarPoderesNovos(n) {
  for (const p of PODERES) {
    if (!p.presente || n < p.libera || progresso.viuPoder(p.id)) continue
    progresso.marcarPoder(p.id)
    progresso.ganhar(p.id, p.presente)
    chuvaDeConfete()
    abrirModal(`<div class="fita verde">Poder novo: ${p.nome}!</div>
      <div class="grande"><img src="${p.icone}" alt="" style="width:110px"></div>
      <p>${p.explica}</p><p><b>${p.presente} de presente</b> pra estrear!</p>
      <button class="btn principal" data-acao="ok">Oba!</button>`)
    await esperarAcao()
  }
}

for (const b of document.querySelectorAll('.poder[data-poder]')) {
  b.onclick = async () => {
    if (!partida || partida.estado !== 'jogando') return
    const item = b.dataset.poder
    const ferramenta = item.slice(0, -1) // martelos -> martelo
    if (item === 'trocas') {
      if (!(await garantirPoder(item))) return
      progresso.gastar(item)
      partida.trocarProxima()
      return atualizarPoderes()
    }
    if (partida.ferramenta === ferramenta) {
      partida.armarFerramenta(null)
      return atualizarPoderes()
    }
    if (!(await garantirPoder(item))) return
    partida.armarFerramenta(ferramenta)
    atualizarPoderes()
  }
}

// Chuva de confete na vitória: dentro da janela, por cima da caixa mas atrás dos botões.
function chuvaDeConfete() {
  const cores = ['#ffd23f', '#ff3d9a', '#22b8ff', '#2fd35b', '#ff8a1f', '#b26bff', '#fff']
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('i')
    el.className = 'confete'
    el.style.cssText = `left:${Math.random() * 100}vw;background:${cores[i % cores.length]};
      animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s;
      width:${6 + Math.random() * 8}px;height:${8 + Math.random() * 10}px;--giro:${Math.random() * 900 - 450}deg`
    $('modal').appendChild(el)
    setTimeout(() => el.remove(), 4000)
  }
}

async function venceu(p) {
  chuvaDeConfete()
  const n = p.fase.n
  const est = contarEstrelas(p.fase, p.restam)
  let ganho = progresso.concluir(n, est)
  if (p.fase.chefe) {
    progresso.ganhar('moedas', ganho)
    ganho *= 2
  }
  const ultima = n >= TOTAL_FASES
  abrirModal(`
    <div class="fita verde">Fase ${n} concluída!</div>
    <img class="mascote-modal" src="/mascote/comemora.png" alt="">
    <div class="estrelas">${[1, 2, 3]
      .map((i) => `<span class="${i <= est ? 'acesa' : 'apagada'}" style="animation-delay:${i * 0.18}s"><img class="ico-estrela" src="/icones/estrela.svg" alt=""></span>`)
      .join('')}</div>
    ${ganho ? `<div class="ganho"><img class="ico-moeda" src="/icones/moeda.svg" alt=""> +${ganho}</div>` : ''}
    ${ganho && n <= FASES_COM_BONUS ? '<div class="bonus-comeco">Moedas em dobro nas 10 primeiras fases!</div>' : ''}
    <p>${['', 'Passou raspando! Será que as 3 estrelas vêm na próxima?', `Quase! Sobraram ${p.restam} frutas. Faltou só uma estrelinha.`, 'Perfeito!'][est]}</p>
    ${ultima ? '' : '<button class="btn principal" data-acao="proxima">Próxima fase</button>'}
    ${est < 3 ? '<button class="btn secundario" data-acao="repetir">Jogar de novo</button>' : ''}
    <button class="btn secundario" data-acao="mapa">Mapa</button>
  `)
  const acao = await esperarAcao()
  await talvezIntersticial()
  if (acao === 'proxima') abrirFase(n + 1)
  else if (acao === 'repetir') abrirFase(n)
  else abrirMapa()
}

async function perdeu(p, motivo) {
  abrirModal(`
    <div class="fita">${{ encheu: 'O pote encheu!', tempo: 'O tempo acabou!' }[motivo] || 'Acabaram as frutas!'}</div>
    <img class="mascote-modal" src="/mascote/triste.png" alt="">
    <p>Faltou pouco! Quer continuar de onde parou?</p>
    <button class="btn video" data-acao="video"><img class="ico-video" src="/icones/video.png" alt=""> +${FRUTAS_DO_VIDEO} frutas</button>
    <button class="btn principal${progresso.moedas < PRECOS.continuar ? ' sem-dinheiro' : ''}" data-acao="moedas">+${FRUTAS_DO_VIDEO} frutas por <img class="ico-moeda" src="/icones/moeda.svg" alt=""> ${PRECOS.continuar}</button>
    <button class="btn secundario" data-acao="repetir">Recomeçar fase</button>
    <button class="btn secundario" data-acao="mapa">Mapa</button>
  `)
  const acao = await esperarAcao()
  if (acao === 'video') {
    const assistiu = await videoPremiado()
    if (assistiu && partida === p) return p.continuar(FRUTAS_DO_VIDEO)
    return perdeu(p, motivo)
  }
  if (acao === 'moedas') {
    if (progresso.pagar(PRECOS.continuar) && partida === p) return p.continuar(FRUTAS_DO_VIDEO)
    return perdeu(p, motivo)
  }
  if (acao === 'repetir') abrirFase(p.fase.n)
  else abrirMapa()
}

// ---------- modal ----------
function abrirModal(html) {
  $('modal-caixa').innerHTML = html
  $('modal').classList.remove('escondida')
}
function fecharModal() {
  $('modal').classList.add('escondida')
}
function esperarAcao() {
  return new Promise((resolve) => {
    $('modal-caixa').onclick = (e) => {
      const acao = e.target.closest('[data-acao]')?.dataset.acao
      if (!acao) return
      $('modal-caixa').onclick = null
      fecharModal()
      resolve(acao)
    }
  })
}

montarInicio()
abrirInicio()
