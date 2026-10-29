// Robô que joga uma fase com a física do jogo (círculos no lugar do contorno das imagens).
import Matter from 'matter-js'
import { FRUTAS } from '../src/frutas.js'
import { paredesDoPote } from '../src/pote.js'

const { Engine, Bodies, Body, Composite, Events } = Matter
const LARGURA = 330
const ALTURA = 580
const LINHA = 125
const SOLTAR_Y = 70
const ESPERA = 28 // quadros entre uma fruta e outra (igual ao jogo)
const JANELA_COMBO = 75

let semente = 1
const aleatorio = () => {
  semente = (semente * 16807) % 2147483647
  return semente / 2147483647
}

export function jogar(fase) {
  const motor = Engine.create()
  motor.gravity.y = 1.1
  const material = { restitution: 0.3, friction: 0.12, frictionStatic: 0.4, frictionAir: 0.004, density: 0.002 }
  Composite.add(motor.world, paredesDoPote(LARGURA, ALTURA))
  for (const p of fase.paredes) Composite.add(motor.world, Bodies.rectangle(p.x, p.y, p.largura, p.grossura || 20, { isStatic: true, angle: p.angulo }))
  const obstaculos = fase.obstaculos.map((o) => {
    const alt = o.tipo === 'caixote' ? o.largura * 0.88 : o.tipo === 'trampolim' ? 18 : 20
    const c = Bodies.rectangle(o.x, o.y, o.largura, alt, { isStatic: true, angle: o.angulo, restitution: o.tipo === 'trampolim' ? 1.3 : 0.2 })
    Object.assign(c, { tipo: o.tipo, giro: o.giro, batidas: 0, ultima: -99 })
    return c
  })
  Composite.add(motor.world, obstaculos)
  for (const o of obstaculos.filter((o) => o.tipo === 'trampolim'))
    Composite.add(motor.world, Bodies.rectangle(o.position.x, o.position.y + (o.bounds.max.x - o.bounds.min.x) * 0.3, (o.bounds.max.x - o.bounds.min.x) * 0.26, (o.bounds.max.x - o.bounds.min.x) * 0.32, { isStatic: true }))

  const estado = { criadas: 0, juncoes: 0, combo: 0, maiorCombo: 0, ultima: -999, quebrados: 0, quadro: 0 }
  const pares = []
  const aoBater = (e) => {
    for (const par of e.pairs) {
      const a = par.bodyA
      const b = par.bodyB
      if (a.nivel !== undefined && a.nivel === b.nivel && !a.sumiu && !b.sumiu && a.nivel < FRUTAS.length - 1) {
        a.sumiu = b.sumiu = true
        pares.push([a, b])
      }
      const fruta = a.nivel !== undefined ? a : b.nivel !== undefined ? b : null
      const tramp = a.tipo === 'trampolim' ? a : b.tipo === 'trampolim' ? b : null
      if (tramp && fruta && estado.quadro - (fruta.ultimoPulo || -99) > 15) {
        fruta.ultimoPulo = estado.quadro
        const lado = fruta.position.x >= tramp.position.x ? 1 : -1
        Body.setVelocity(fruta, { x: fruta.velocity.x * 0.5 + lado * 3.5, y: -Math.max(9, Math.abs(fruta.velocity.y) * 1.1) })
      }
      const obs = a.tipo === 'caixote' ? a : b.tipo === 'caixote' ? b : null
      if (obs && fruta && !obs.quebrado && fruta.speed > 3 && estado.quadro - obs.ultima > 30) {
        obs.ultima = estado.quadro
        if (++obs.batidas >= 3) obs.quebrado = true
      }
    }
  }
  Events.on(motor, 'collisionStart', aoBater)
  Events.on(motor, 'collisionActive', aoBater)

  const criar = (x, y, nivel) => {
    const c = Bodies.circle(x, y, FRUTAS[nivel].raio, material)
    c.nivel = nivel
    return c
  }
  const meta = fase.meta
  const venceu = () =>
    meta.tipo === 'criar' ? estado.criadas >= meta.qtd
      : meta.tipo === 'juntar' ? estado.juncoes >= meta.vezes
        : meta.tipo === 'combo' ? estado.maiorCombo >= meta.vezes
          : estado.quebrados >= meta.vezes

  const passo = () => {
    estado.quadro++
    for (const o of obstaculos) if (o.tipo === 'helice') { Body.setAngle(o, o.angle + o.giro); Body.setAngularVelocity(o, o.giro) }
    Engine.update(motor, 1000 / 60)
    for (const o of obstaculos) if (o.quebrado && !o.removido) { o.removido = true; Composite.remove(motor.world, o); estado.quebrados++ }
    while (pares.length) {
      const [a, b] = pares.pop()
      Composite.remove(motor.world, [a, b])
      const nivel = a.nivel + 1
      const rn = FRUTAS[nivel].raio
      const nx = Math.max(rn, Math.min(LARGURA - rn, (a.position.x + b.position.x) / 2))
      const ny = Math.min(ALTURA - rn, (a.position.y + b.position.y) / 2)
      Composite.add(motor.world, criar(nx, ny, nivel))
      estado.juncoes++
      estado.combo = estado.quadro - estado.ultima < JANELA_COMBO ? estado.combo + 1 : 1
      estado.ultima = estado.quadro
      estado.maiorCombo = Math.max(estado.maiorCombo, estado.combo)
      if (meta.tipo === 'criar' && nivel >= meta.alvo) estado.criadas++
    }
    for (const c of Composite.allBodies(motor.world)) {
      if (c.nivel === undefined) continue
      if (c.bounds.min.y < LINHA && Math.abs(c.velocity.y) < 0.3) c.acima = (c.acima || 0) + 1
      else c.acima = 0
      if (c.acima > 90) return 'encheu'
    }
    if (fase.tempo && estado.quadro > fase.tempo * 60) return 'tempo'
    return venceu() ? 'venceu' : null
  }

  // escolhe onde soltar: em cima de uma igual é ótimo; pilha alta é ruim
  const escolherX = (nivel) => {
    const r = FRUTAS[nivel].raio
    const parede = fase.paredes.find((p) => p.grossura)?.grossura || 0
    const frutas = Composite.allBodies(motor.world).filter((c) => c.nivel !== undefined)
    let melhor = LARGURA / 2
    let nota = -Infinity
    for (let i = 0; i < 14; i++) {
      const x = parede + r + ((LARGURA - 2 * (r + parede)) * i) / 13
      const coluna = frutas.filter((c) => Math.abs(c.position.x - x) < FRUTAS[c.nivel].raio + r * 0.6)
      const topo = coluna.reduce((m, c) => (c.bounds.min.y < m.bounds.min.y ? c : m), { bounds: { min: { y: ALTURA } } })
      let n = (topo.bounds.min.y - LINHA) / 40 // quanto espaço sobra
      if (topo.nivel === nivel) n += 12 + nivel
      if (coluna.some((c) => c.nivel === nivel && c !== topo)) n += 3
      if (topo.nivel !== undefined && topo.nivel !== nivel && topo.nivel < nivel) n -= 2
      n += aleatorio() * 1.5
      if (n > nota) { nota = n; melhor = x }
    }
    return melhor
  }

  let restam = fase.frutas
  while (restam > 0) {
    const nivel = Math.floor(aleatorio() * (fase.maiorQueCai + 1))
    Composite.add(motor.world, criar(escolherX(nivel), SOLTAR_Y, nivel))
    restam--
    for (let i = 0; i < ESPERA + 12; i++) {
      const r = passo()
      if (r) return { resultado: r, restam }
    }
  }
  for (let i = 0; i < 200; i++) {
    const r = passo()
    if (r) return { resultado: r, restam }
  }
  return { resultado: 'acabou', restam }
}


// Joga a fase várias vezes (sempre com as mesmas sementes) e devolve a taxa de vitória.
// outrasJogadas: usa sementes diferentes das da calibragem (pra conferir de verdade)
export function taxaDeVitoria(fase, tentativas, outrasJogadas = 0) {
  let ganhou = 0
  const motivos = {}
  for (let t = 0; t < tentativas; t++) {
    semente = fase.n * 1000 + t + 7 + outrasJogadas * 777777
    const { resultado } = jogar(fase)
    if (resultado === 'venceu') ganhou++
    else motivos[resultado] = (motivos[resultado] || 0) + 1
  }
  return { taxa: ganhou / tentativas, ganhou, motivos }
}
