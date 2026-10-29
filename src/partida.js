// Uma partida de uma fase: física, toque pra soltar, juntar frutas e checar meta.
import Matter from 'matter-js'
import { FRUTAS, desenharFruta, formaDaFruta } from './frutas.js'
import { som } from './som.js'
import { paredesDoPote, QUEDA_FUNDO } from './pote.js'

const { Engine, Bodies, Body, Composite, Events, Vertices } = Matter

export const LARGURA = 330
export const ALTURA = 580
const ALTURA_SOLTAR = 70
const LINHA_LIMITE = 125
const ESPERA_ENTRE_FRUTAS = 28 // quadros
const QUADROS_ACIMA_PRA_PERDER = 90
export const GROSSURA_TABUA = 20
const CORES_CONFETE = ['#ffe14d', '#ff4d8d', '#4dd2ff', '#7dff6a', '#ff9a1f', '#b26bff']
const JANELA_COMBO = 75 // quadros entre duas junções pra contar como combo
const ELOGIOS = ['', '', '', 'Boa!', 'Muito bem!', 'Incrível!', 'Uau!', 'Sensacional!', 'Lendário!', 'MELANCIA!']

export class Partida {
  constructor(canvas, fase, eventos) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.fase = fase
    this.eventos = eventos // { mudou, venceu, perdeu }
    this.restam = fase.frutas
    this.criadas = 0 // quantas frutas-meta já nasceram
    this.juncoes = 0 // quantas vezes juntou frutas
    this.maiorCombo = 0
    this.quebrados = 0 // caixotes quebrados
    this.tempoRestante = fase.tempo ? fase.tempo * 60 : null // em quadros
    this.estado = 'jogando'
    this.espera = 0
    this.paradoSemFruta = 0
    this.mira = LARGURA / 2
    this.efeitos = []
    this.textos = []
    this.estouros = [] // caixotes que acabaram de quebrar (desenho das tábuas voando)
    this.quadro = 0
    this.ultimaJuncao = -999
    this.combo = 0
    this.tremor = 0
    this.proxima = this.sortear() // a fruta na mão
    this.depois = this.sortear() // a que vem em seguida (aparece embaixo, pra planejar)

    this.motor = Engine.create()
    this.motor.gravity.y = 1.1
    const paredes = paredesDoPote(LARGURA, ALTURA)
    this.obstaculos = fase.obstaculos.map((o) => {
      const altura = o.tipo === 'caixote' ? o.largura * 0.88 : o.tipo === 'trampolim' ? 18 : GROSSURA_TABUA
      const corpo = Bodies.rectangle(o.x, o.y, o.largura, altura, {
        isStatic: true,
        angle: o.angulo,
        chamfer: { radius: o.tipo === 'caixote' ? 6 : 7 },
        // trampolim devolve mais força do que recebe: a fruta sai voando
        restitution: o.tipo === 'trampolim' ? 1.3 : 0.2,
      })
      Object.assign(corpo, { tipo: o.tipo, largura: o.largura, alturaObs: altura, giro: o.giro, batidas: 0, pulo: 0 })
      return corpo
    })
    // o trampolim tem um pé de cogumelo embaixo, que também é sólido
    // tábuas fixas do formato do pote (estreito, degrau, funil)
    this.paredesFormato = (fase.paredes || []).map((p) => {
      const grossura = p.grossura || GROSSURA_TABUA
      const corpo = Bodies.rectangle(p.x, p.y, p.largura, grossura, { isStatic: true, angle: p.angulo, chamfer: { radius: 7 } })
      Object.assign(corpo, { tipo: 'tabua', largura: p.largura, alturaObs: grossura, fixa: true })
      return corpo
    })
    Composite.add(this.motor.world, this.paredesFormato)
    const pes = this.obstaculos
      .filter((o) => o.tipo === 'trampolim')
      .map((o) => Bodies.rectangle(o.position.x, o.position.y + o.largura * 0.3, o.largura * 0.26, o.largura * 0.32, { isStatic: true, chamfer: { radius: 6 } }))
    Composite.add(this.motor.world, [...paredes, ...this.obstaculos, ...pes])
    Events.on(this.motor, 'collisionStart', (e) => {
      this.colisoes(e)
      this.batidasEmObstaculos(e)
    })
    // frutas que já estavam encostadas quando a parceira sumiu também precisam juntar
    Events.on(this.motor, 'collisionActive', (e) => {
      this.colisoes(e)
      this.pulosNoTrampolim(e)
    })

    // arrasta pra mirar e solta o dedo pra largar: assim o dedo não esconde onde a fruta vai cair
    this.aoMover = (e) => (this.mira = this.posicaoX(e))
    this.aoTocar = (e) => {
      this.mira = this.posicaoX(e)
      if (this.ferramenta) return this.usarFerramenta(this.mira, this.posicaoY(e))
      this.mirando = true
      this.soltarQuandoPronta = false
      canvas.setPointerCapture?.(e.pointerId)
    }
    this.aoSoltarDedo = (e) => {
      if (!this.mirando) return
      this.mirando = false
      this.mira = this.posicaoX(e)
      // soltou o dedo antes da fruta ficar pronta: ela cai assim que puder
      if (this.espera > 0) this.soltarQuandoPronta = true
      else this.soltar()
    }
    this.aoCancelar = () => (this.mirando = false)
    canvas.addEventListener('pointermove', this.aoMover)
    canvas.addEventListener('pointerdown', this.aoTocar)
    canvas.addEventListener('pointerup', this.aoSoltarDedo)
    canvas.addEventListener('pointercancel', this.aoCancelar)

    this.rodando = true
    const quadro = () => {
      if (!this.rodando) return
      this.passo()
      this.desenhar()
      requestAnimationFrame(quadro)
    }
    requestAnimationFrame(quadro)
  }

  encerrar() {
    this.rodando = false
    this.canvas.removeEventListener('pointermove', this.aoMover)
    this.canvas.removeEventListener('pointerdown', this.aoTocar)
    this.canvas.removeEventListener('pointerup', this.aoSoltarDedo)
    this.canvas.removeEventListener('pointercancel', this.aoCancelar)
    Engine.clear(this.motor)
  }

  // onde a fruta cai: dentro do pote e, no pote estreito, entre as colunas
  xDeSoltar(nivel) {
    const r = FRUTAS[nivel].raio
    const coluna = (this.fase.paredes || []).find((p) => p.grossura)?.grossura || 0
    return Math.max(coluna + r, Math.min(LARGURA - coluna - r, this.mira))
  }

  sortear() {
    return Math.floor(Math.random() * (this.fase.maiorQueCai + 1))
  }

  // posição dentro do desenho, descontando a borda do pote (cada visual tem a sua)
  posicaoX(e) {
    const r = this.canvas.getBoundingClientRect()
    return ((e.clientX - r.left - this.canvas.clientLeft) * LARGURA) / this.canvas.clientWidth
  }

  posicaoY(e) {
    const r = this.canvas.getBoundingClientRect()
    return ((e.clientY - r.top - this.canvas.clientTop) * ALTURA) / this.canvas.clientHeight
  }

  // Power-ups de toque: o próximo toque usa a ferramenta armada na fruta tocada.
  // martelo quebra a fruta, bomba estoura ela e as de volta, varinha transforma na seguinte.
  armarFerramenta(nome) {
    this.ferramenta = nome
  }

  usarFerramenta(x, y) {
    const frutas = Composite.allBodies(this.motor.world).filter((c) => c.nivel !== undefined && !c.sumiu)
    const alvo = Matter.Query.point(frutas, { x, y })[0]
    if (!alvo) return
    const nome = this.ferramenta
    const { x: ax, y: ay } = alvo.position
    if (nome === 'varinha') {
      if (alvo.nivel >= FRUTAS.length - 1) return // a maior não cresce mais
      const nivel = alvo.nivel + 1
      Composite.remove(this.motor.world, alvo)
      Composite.add(this.motor.world, this.criarFruta(ax, Math.min(ALTURA - FRUTAS[nivel].raio, ay), nivel))
      this.efeitos.push({ x: ax, y: ay, r: FRUTAS[nivel].raio, t: 0 })
      this.textos.push({ txt: 'Plim!', x: ax, y: ay - 30, t: 0, cor: '#b8a3ff', tam: 30 })
      som.juntar(nivel)
      if (this.fase.meta.tipo === 'criar' && nivel >= this.fase.meta.alvo) this.criadas++
    } else {
      // a bomba pega tudo que encosta num círculo em volta da fruta tocada
      const alcance = nome === 'bomba' ? FRUTAS[alvo.nivel].raio + 40 : 0
      const atingidas = nome === 'bomba' ? frutas.filter((c) => Math.hypot(c.position.x - ax, c.position.y - ay) <= alcance + FRUTAS[c.nivel].raio * 0.5) : [alvo]
      Composite.remove(this.motor.world, atingidas)
      for (const c of atingidas) this.efeitos.push({ x: c.position.x, y: c.position.y, r: FRUTAS[c.nivel].raio, t: 0 })
      if (nome === 'bomba') {
        this.tremor = 12
        this.textos.push({ txt: 'BUM!', x: ax, y: ay - 20, t: 0, cor: '#ff8a1f', tam: 40 })
        som.juntar(6)
      } else som.juntar(0)
    }
    this.ferramenta = null
    this.eventos.usouFerramenta?.(nome)
    this.eventos.mudou(this)
    this.checarMeta()
  }

  // Power-up: troca a fruta que está na mão.
  trocarProxima() {
    let nova = this.proxima
    while (this.fase.maiorQueCai > 0 && nova === this.proxima) nova = this.sortear()
    this.proxima = nova
  }

  criarFruta(x, y, nivel) {
    // quica um pouco, escorrega pouco: parece fruta de verdade caindo
    const material = { restitution: 0.3, friction: 0.12, frictionStatic: 0.4, frictionAir: 0.004, density: 0.002 }
    const forma = formaDaFruta(nivel)
    let corpo
    if (forma) {
      // o Matter centraliza o corpo no centro de massa; guardamos a diferença
      // pra desenhar a imagem no lugar certo
      corpo = Bodies.fromVertices(x, y, [forma], material)
      corpo.desvio = Vertices.centre(forma)
      Body.setPosition(corpo, { x, y })
    } else {
      corpo = Bodies.circle(x, y, FRUTAS[nivel].raio, material)
      corpo.desvio = { x: 0, y: 0 }
    }
    // um giro leve ao nascer, pra cada queda ser diferente
    Body.setAngularVelocity(corpo, (Math.random() - 0.5) * 0.08)
    corpo.nivel = nivel
    return corpo
  }

  soltar() {
    if (this.estado !== 'jogando' || this.espera > 0 || this.restam <= 0) return
    const x = this.xDeSoltar(this.proxima)
    Composite.add(this.motor.world, this.criarFruta(x, ALTURA_SOLTAR, this.proxima))
    som.soltar()
    this.restam--
    this.proxima = this.depois
    this.depois = this.sortear()
    this.espera = ESPERA_ENTRE_FRUTAS
    this.paradoSemFruta = 0
    this.eventos.mudou(this)
  }

  colisoes(e) {
    for (const par of e.pairs) {
      const a = par.bodyA
      const b = par.bodyB
      if (a.nivel === undefined || a.nivel !== b.nivel || a.sumiu || b.sumiu) continue
      if (a.nivel >= FRUTAS.length - 1) continue
      a.sumiu = b.sumiu = true
      // fora do loop da física, senão o Matter reclama
      setTimeout(() => this.juntar(a, b), 0)
    }
  }

  // Fruta que ficou encostada no cogumelo também é lançada.
  pulosNoTrampolim(e) {
    for (const par of e.pairs) {
      const obs = par.bodyA.tipo === 'trampolim' ? par.bodyA : par.bodyB.tipo === 'trampolim' ? par.bodyB : null
      if (obs) this.batidasEmObstaculos({ pairs: [par] })
    }
  }

  // Fruta batendo em obstáculo: trampolim pula, caixote racha e quebra.
  batidasEmObstaculos(e) {
    for (const par of e.pairs) {
      const obs = par.bodyA.tipo ? par.bodyA : par.bodyB.tipo ? par.bodyB : null
      const fruta = par.bodyA.nivel !== undefined ? par.bodyA : par.bodyB.nivel !== undefined ? par.bodyB : null
      if (!obs || !fruta) continue
      if (obs.tipo === 'trampolim' && this.quadro - (fruta.ultimoPulo || -99) > 15) {
        // lança a fruta pra cima e pro lado de fora do chapéu: nunca fica parada em cima
        fruta.ultimoPulo = this.quadro
        const lado = fruta.position.x >= obs.position.x ? 1 : -1
        const forca = Math.max(9, Math.abs(fruta.velocity.y) * 1.1)
        Body.setVelocity(fruta, { x: fruta.velocity.x * 0.5 + lado * 3.5, y: -forca })
        obs.pulo = 12
        som.combo(1)
      }
      // só conta batida com força, e uma de cada vez (quique pequeno não racha)
      if (obs.tipo === 'caixote' && !obs.quebrado && fruta.speed > 3 && this.quadro - (obs.ultimaBatida || -99) > 30) {
        obs.ultimaBatida = this.quadro
        obs.batidas++
        obs.pulo = 8
        if (obs.batidas >= 3) {
          obs.quebrado = true
          setTimeout(() => {
            Composite.remove(this.motor.world, obs)
            this.obstaculos = this.obstaculos.filter((o) => o !== obs)
            this.estouros.push({ x: obs.position.x, y: obs.position.y, w: obs.largura, t: 0 })
            this.textos.push({ txt: 'Quebrou!', x: obs.position.x, y: obs.position.y - 30, t: 0, cor: '#ffb347', tam: 28 })
            this.tremor = 8
            som.juntar(5)
            this.quebrados++
            this.eventos.mudou(this)
            this.checarMeta()
          }, 0)
        }
      }
    }
  }

  juntar(a, b) {
    if (!this.rodando) return
    const nivel = a.nivel + 1
    // a fruta nova é maior que as duas: nasce inteira dentro do pote, longe das paredes
    const rNova = FRUTAS[nivel].raio
    const x = Math.max(rNova, Math.min(LARGURA - rNova, (a.position.x + b.position.x) / 2))
    const y = Math.min(ALTURA - rNova, (a.position.y + b.position.y) / 2)
    Composite.remove(this.motor.world, [a, b])
    Composite.add(this.motor.world, this.criarFruta(x, y, nivel))
    som.juntar(nivel)
    this.efeitos.push({ x, y, r: FRUTAS[nivel].raio, t: 0 })

    // combo: juntou de novo rapidinho
    this.combo = this.quadro - this.ultimaJuncao < JANELA_COMBO ? this.combo + 1 : 1
    this.ultimaJuncao = this.quadro
    if (this.combo >= 2) {
      this.textos.push({ txt: `Combo x${this.combo}!`, x: Math.max(90, Math.min(LARGURA - 90, x)), y: y - 30, t: 0, cor: CORES_CONFETE[this.combo % CORES_CONFETE.length], tam: 26 + this.combo * 3 })
      som.combo(this.combo)
    }
    // elogios que saem juntos ficam empilhados, não um em cima do outro
    const noMeio = this.textos.filter((t) => t.meio && t.t < 40).length
    if (ELOGIOS[nivel]) this.textos.push({ txt: ELOGIOS[nivel], x: LARGURA / 2, y: 260 - noMeio * 44, t: 0, cor: '#ffe14d', tam: 30 + nivel * 3, meio: true })
    if (nivel >= 4) this.tremor = Math.min(14, nivel * 2)

    if (this.combo >= 2 || nivel >= 4) this.eventos.festejou?.(this)
    this.juncoes++
    this.maiorCombo = Math.max(this.maiorCombo, this.combo)
    if (this.fase.meta.tipo === 'criar' && nivel >= this.fase.meta.alvo) this.criadas++
    this.eventos.mudou(this)
    this.checarMeta()
  }

  // Quanto já fez da meta: { feito, total }
  progressoMeta() {
    const m = this.fase.meta
    if (m.tipo === 'criar') return { feito: this.criadas, total: m.qtd }
    if (m.tipo === 'juntar') return { feito: this.juncoes, total: m.vezes }
    if (m.tipo === 'combo') return { feito: Math.min(this.maiorCombo, m.vezes), total: m.vezes }
    return { feito: this.quebrados, total: m.vezes }
  }

  checarMeta() {
    if (this.estado !== 'jogando') return
    const { feito, total } = this.progressoMeta()
    if (feito < total) return
    this.estado = 'venceu'
    som.vitoria()
    setTimeout(() => this.eventos.venceu(this), 700)
  }

  // Depois do vídeo premiado: +5 frutas e tira o que estiver acima da linha.
  continuar(extras) {
    for (const c of Composite.allBodies(this.motor.world)) {
      if (c.nivel !== undefined && c.bounds.min.y < LINHA_LIMITE + 20) {
        Composite.remove(this.motor.world, c)
      }
    }
    this.restam += extras
    if (this.tempoRestante !== null && this.tempoRestante <= 0) this.tempoRestante = 20 * 60
    this.estado = 'jogando'
    this.paradoSemFruta = 0
    this.eventos.mudou(this)
  }

  perder(motivo) {
    this.estado = 'perdeu'
    som.derrota()
    setTimeout(() => this.eventos.perdeu(this, motivo), 500)
  }

  passo() {
    for (const o of this.obstaculos) {
      if (o.tipo === 'helice') {
        Body.setAngle(o, o.angle + o.giro)
        Body.setAngularVelocity(o, o.giro)
      }
      if (o.pulo > 0) o.pulo--
    }
    Engine.update(this.motor, 1000 / 60)
    this.quadro++
    if (this.espera > 0) this.espera--
    if (this.espera === 0 && this.soltarQuandoPronta) {
      this.soltarQuandoPronta = false
      this.soltar()
    }
    if (this.tremor > 0) {
      this.tremor *= 0.85
      if (this.tremor < 0.5) this.tremor = 0
      const t = this.tremor
      this.canvas.style.transform = t ? `translate(${(Math.random() - 0.5) * t}px, ${(Math.random() - 0.5) * t}px)` : ''
    }
    if (this.estado !== 'jogando') return

    for (const c of Composite.allBodies(this.motor.world)) {
      if (c.nivel === undefined) continue
      const acima = c.bounds.min.y < LINHA_LIMITE
      if (acima && this.espera === 0 && Math.abs(c.velocity.y) < 0.3) {
        c.acima = (c.acima || 0) + 1
        if (c.acima > QUADROS_ACIMA_PRA_PERDER) return this.perder('encheu')
      } else {
        c.acima = 0
      }
    }

    if (this.restam <= 0) {
      this.paradoSemFruta++
      if (this.paradoSemFruta > 150) this.perder('acabou')
    }

    // fase com tempo: o relógio corre; avisa a tela a cada segundo
    if (this.tempoRestante !== null) {
      this.tempoRestante--
      if (this.tempoRestante % 60 === 0) this.eventos.mudou(this)
      if (this.tempoRestante <= 0) return this.perder('tempo')
    }
  }

  desenhar() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, LARGURA, ALTURA)

    // linha limite
    const perigo = Composite.allBodies(this.motor.world).some((c) => c.acima > 0)
    ctx.strokeStyle = perigo ? '#ff3d6e' : 'rgba(255,255,255,.35)'
    ctx.setLineDash([6, 6])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, LINHA_LIMITE)
    ctx.lineTo(LARGURA, LINHA_LIMITE)
    ctx.stroke()
    ctx.setLineDash([])

    // fundo de vidro grosso (mais fundo no meio, igual à física)
    ctx.fillStyle = 'rgba(255,255,255,.18)'
    ctx.strokeStyle = 'rgba(255,255,255,.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, ALTURA - QUEDA_FUNDO)
    ctx.lineTo(LARGURA / 2, ALTURA)
    ctx.lineTo(LARGURA, ALTURA - QUEDA_FUNDO)
    ctx.stroke()
    ctx.lineTo(LARGURA, ALTURA)
    ctx.lineTo(0, ALTURA)
    ctx.fill()

    for (const o of [...this.paredesFormato, ...this.obstaculos]) {
      ctx.save()
      ctx.translate(o.position.x, o.position.y)
      ctx.rotate(o.angle)
      desenharObstaculo(ctx, o)
      ctx.restore()
    }

    for (const c of Composite.allBodies(this.motor.world)) {
      if (c.nivel === undefined) continue
      // melancia dourada (última fruta do Mundo 4): aura dourada pulsando e brilhinhos
      if (this.fase.mundo === 4 && c.nivel === FRUTAS.length - 1) desenharAuraDourada(ctx, c, this.quadro)
      ctx.save()
      ctx.translate(c.position.x, c.position.y)
      ctx.rotate(c.angle)
      ctx.translate(-c.desvio.x, -c.desvio.y)
      desenharFruta(ctx, c.nivel)
      ctx.restore()
    }

    // estouro: anel + confete colorido
    this.efeitos = this.efeitos.filter((ef) => {
      ef.t++
      if (!ef.confete) {
        ef.confete = Array.from({ length: 14 }, (_, i) => ({
          a: (i / 14) * Math.PI * 2,
          v: 3 + Math.random() * 4,
          cor: CORES_CONFETE[i % CORES_CONFETE.length],
        }))
      }
      const vida = 1 - ef.t / 26
      ctx.strokeStyle = `rgba(255,255,255,${vida})`
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(ef.x, ef.y, ef.r + ef.t * 2.2, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = Math.max(0, vida)
      for (const p of ef.confete) {
        const d = ef.r * 0.6 + p.v * ef.t
        ctx.fillStyle = p.cor
        ctx.fillRect(ef.x + Math.cos(p.a) * d - 3, ef.y + Math.sin(p.a) * d + ef.t * ef.t * 0.04 - 3, 6, 6)
      }
      ctx.globalAlpha = 1
      return ef.t < 26
    })

    // caixote estourando: as tábuas abrem e somem em meio segundo
    this.estouros = this.estouros.filter((e) => {
      e.t++
      const img = ARTE['caixote-estouro']
      if (pronta(img)) {
        const lado = e.w * (1.2 + e.t * 0.03)
        ctx.save()
        ctx.globalAlpha = Math.max(0, 1 - e.t / 30)
        ctx.drawImage(img, e.x - lado / 2, e.y - (lado * img.height) / img.width / 2, lado, (lado * img.height) / img.width)
        ctx.restore()
      }
      return e.t < 30
    })

    // textos que pulam: crescem rápido, sobem e somem
    this.textos = this.textos.filter((tx) => {
      tx.t++
      const escala = tx.t < 8 ? 0.4 + (tx.t / 8) * 0.8 : 1.2 - Math.min(0.2, (tx.t - 8) * 0.02)
      ctx.save()
      ctx.translate(tx.x, tx.y - tx.t * 1.2)
      ctx.scale(escala, escala)
      ctx.globalAlpha = Math.min(1, (60 - tx.t) / 15)
      ctx.font = `${tx.tam}px 'Lilita One', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 8
      ctx.strokeStyle = '#2a0a6b'
      ctx.strokeText(tx.txt, 0, 0)
      ctx.fillStyle = tx.cor
      ctx.fillText(tx.txt, 0, 0)
      ctx.restore()
      return tx.t < 60
    })

    // fruta na mão
    if (this.estado === 'jogando' && this.restam > 0) {
      const x = this.xDeSoltar(this.proxima)
      ctx.save()
      ctx.globalAlpha = this.espera > 0 ? 0.35 : 1
      ctx.translate(x, ALTURA_SOLTAR)
      desenharFruta(ctx, this.proxima)
      ctx.restore()
    }
  }
}

// Arte da IA dos obstáculos. A imagem é aparada (tira a sobra transparente)
// pra encaixar certinho no tamanho de cada um.
const ARTE = {}
function aparar(img) {
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const { data, width: w, height: h } = ctx.getImageData(0, 0, c.width, c.height)
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3] > 30) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  const saida = document.createElement('canvas')
  saida.width = x1 - x0 + 1
  saida.height = y1 - y0 + 1
  saida.getContext('2d').drawImage(c, -x0, -y0)
  return saida
}
for (const nome of ['caixote', 'caixote-2', 'caixote-3', 'caixote-estouro', 'tabua', 'trampolim', 'helice']) {
  const img = new Image()
  img.onload = () => (ARTE[nome] = aparar(img))
  img.src = `/obstaculos/${nome}.png`
}
const pronta = (img) => !!img && (img instanceof HTMLCanvasElement || (img.complete && img.naturalWidth > 0))

function desenharObstaculo(ctx, o) {
  const w = o.largura
  const h = o.alturaObs
  // tábua e hélice: imagem esticada na largura do obstáculo, mantendo a proporção
  if ((o.tipo === 'tabua' || o.tipo === 'helice') && pronta(ARTE[o.tipo])) {
    const img = ARTE[o.tipo]
    // desenho com a mesma grossura do corpo físico (um pouco a mais só pela borda),
    // senão a fruta parece entrar na madeira
    const alt = h + 5
    ctx.drawImage(img, -w / 2, -alt / 2, w, alt)
    return
  }
  // trampolim: cogumelo com o topo do chapéu no topo do corpo; amassa quando pula
  if (o.tipo === 'trampolim' && pronta(ARTE.trampolim)) {
    const img = ARTE.trampolim
    const larg = w * 1.08
    const alt = (larg * img.height) / img.width
    const amassa = o.pulo > 0 ? 1 - Math.sin((o.pulo / 12) * Math.PI) * 0.15 : 1
    ctx.save()
    ctx.translate(0, -h / 2 - 4)
    ctx.scale(1 + (1 - amassa) * 0.6, amassa)
    ctx.drawImage(img, -larg / 2, 0, larg, alt)
    ctx.restore()
    return
  }
  if (o.tipo === 'caixote') {
    // inteiro -> rachado -> muito rachado, conforme as batidas
    const img = ARTE[['caixote', 'caixote-2', 'caixote-3'][Math.min(o.batidas, 2)]] || ARTE.caixote
    if (pronta(img)) {
      const treme = o.pulo > 0 ? (Math.random() - 0.5) * 4 : 0
      const alt = (w * 1.04 * img.height) / img.width
      ctx.drawImage(img, -w * 0.52 + treme, -alt / 2, w * 1.04, alt)
      return
    }
  }
  if (o.tipo === 'tabua' || o.tipo === 'helice') {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
    if (o.tipo === 'tabua') {
      g.addColorStop(0, '#e8a65a')
      g.addColorStop(1, '#8a4b14')
    } else {
      g.addColorStop(0, '#ff7ab8')
      g.addColorStop(1, '#b0105a')
    }
    ctx.fillStyle = g
    ctx.strokeStyle = o.tipo === 'tabua' ? '#5a2e08' : '#6b0030'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.fillRect(-w / 2 + 8, -h / 2 + 3, w - 16, 3)
    if (o.tipo === 'tabua') {
      ctx.fillStyle = '#5a2e08'
      for (const x of [-w / 2 + 9, w / 2 - 9]) {
        ctx.beginPath()
        ctx.arc(x, 1, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.fillStyle = '#ffd23f'
      ctx.strokeStyle = '#8a5a00'
      ctx.beginPath()
      ctx.arc(0, 0, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    return
  }
  if (o.tipo === 'trampolim') {
    const amassa = o.pulo > 0 ? Math.sin((o.pulo / 12) * Math.PI) * 6 : 0
    ctx.fillStyle = '#f1e6c8'
    ctx.fillRect(-w * 0.12, 0, w * 0.24, h / 2 + 6)
    const g = ctx.createLinearGradient(0, -h - 10, 0, h / 2)
    g.addColorStop(0, '#ff8a8a')
    g.addColorStop(1, '#c4102a')
    ctx.fillStyle = g
    ctx.strokeStyle = '#6a0010'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.ellipse(0, h / 2, w / 2, h + 6 - amassa, 0, Math.PI, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff'
    for (const [x, y, r] of [[-w * 0.25, -h * 0.1, 5], [w * 0.05, -h * 0.55, 6], [w * 0.3, -h * 0.05, 4]]) {
      ctx.beginPath()
      ctx.arc(x, y + amassa * 0.5, r, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }
  if (o.tipo === 'caixote') {
    const treme = o.pulo > 0 ? (Math.random() - 0.5) * 3 : 0
    ctx.translate(treme, 0)
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
    g.addColorStop(0, '#e8a65a')
    g.addColorStop(1, '#9a5a1c')
    ctx.fillStyle = g
    ctx.strokeStyle = '#5a2e08'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, 6)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-w / 2 + 6, -h / 2 + 6)
    ctx.lineTo(w / 2 - 6, h / 2 - 6)
    ctx.moveTo(w / 2 - 6, -h / 2 + 6)
    ctx.lineTo(-w / 2 + 6, h / 2 - 6)
    ctx.stroke()
    // rachaduras conforme apanha
    ctx.strokeStyle = '#2a1404'
    ctx.lineWidth = 2
    if (o.batidas >= 1) {
      ctx.beginPath()
      ctx.moveTo(-w * 0.3, -h / 2)
      ctx.lineTo(-w * 0.15, -h * 0.15)
      ctx.lineTo(-w * 0.28, h * 0.1)
      ctx.stroke()
    }
    if (o.batidas >= 2) {
      ctx.beginPath()
      ctx.moveTo(w / 2, h * 0.05)
      ctx.lineTo(w * 0.15, h * 0.2)
      ctx.lineTo(w * 0.25, h / 2)
      ctx.stroke()
    }
  }
}

function desenharAuraDourada(ctx, corpo, quadro) {
  const r = FRUTAS[corpo.nivel].raio
  const { x, y } = corpo.position
  const pulso = 1 + Math.sin(quadro / 12) * 0.08
  const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.5 * pulso)
  g.addColorStop(0, 'rgba(255, 225, 90, 0.9)')
  g.addColorStop(1, 'rgba(255, 200, 40, 0)')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter' // soma luz: acende mesmo em fundo claro
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r * 1.5 * pulso, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // 6 brilhinhos girando em volta, piscando fora de compasso
  for (let i = 0; i < 6; i++) {
    const a = quadro / 40 + (i * Math.PI) / 3
    const d = r * (1.15 + 0.1 * Math.sin(quadro / 9 + i))
    const t = 4 + 5 * Math.abs(Math.sin(quadro / 8 + i * 1.7))
    const bx = x + Math.cos(a) * d
    const by = y + Math.sin(a) * d
    ctx.fillStyle = 'rgba(255, 250, 210, 0.95)'
    ctx.beginPath()
    ctx.moveTo(bx, by - t * 1.8)
    ctx.lineTo(bx + t * 0.45, by - t * 0.45)
    ctx.lineTo(bx + t * 1.8, by)
    ctx.lineTo(bx + t * 0.45, by + t * 0.45)
    ctx.lineTo(bx, by + t * 1.8)
    ctx.lineTo(bx - t * 0.45, by + t * 0.45)
    ctx.lineTo(bx - t * 1.8, by)
    ctx.lineTo(bx - t * 0.45, by - t * 0.45)
    ctx.fill()
  }
}
