// Camada animada por cima do cenário do menu: brilho do sol pulsando,
// folhas e pétalas caindo e pontinhos de luz subindo.
export function animarFundo(canvas) {
  const ctx = canvas.getContext('2d')
  let W = 0
  let H = 0
  const dpr = Math.min(2, window.devicePixelRatio || 1)

  function medir() {
    const r = canvas.getBoundingClientRect()
    W = r.width
    H = r.height
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  medir()
  window.addEventListener('resize', medir)

  const rnd = (a, b) => a + Math.random() * (b - a)

  const CORES_FOLHA = ['#6cc04a', '#4fa83a', '#9fd65a', '#ff8fb8', '#ffb3cf', '#ffd46b']
  const novaFolha = (topo) => ({
    x: rnd(0, 1),
    y: topo ? rnd(-0.1, 1) : -0.05,
    v: rnd(0.025, 0.05),
    giro: rnd(0, Math.PI * 2),
    vg: rnd(-1.5, 1.5),
    balanco: rnd(0, Math.PI * 2),
    tam: rnd(6, 11),
    cor: CORES_FOLHA[Math.floor(Math.random() * CORES_FOLHA.length)],
  })
  const folhas = Array.from({ length: 14 }, () => novaFolha(true))

  const novaLuz = (qualquer) => ({
    x: rnd(0, 1),
    y: qualquer ? rnd(0.3, 1) : rnd(0.95, 1.05),
    v: rnd(0.008, 0.02),
    fase: rnd(0, Math.PI * 2),
    r: rnd(1.2, 2.6),
  })
  const luzes = Array.from({ length: 26 }, () => novaLuz(true))

  let antes = performance.now()
  let rodando = true

  function quadro(agora) {
    if (!rodando) return
    requestAnimationFrame(quadro)
    const dt = Math.min(0.05, (agora - antes) / 1000)
    antes = agora
    const t = agora / 1000
    ctx.clearRect(0, 0, W, H)

    // sol: brilho quente pulsando no alto à direita
    const pulso = 1 + Math.sin(t * 1.3) * 0.08
    const sx = W * 0.82
    const sy = H * 0.1
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.55 * pulso)
    g.addColorStop(0, 'rgba(255, 236, 170, 0.55)')
    g.addColorStop(0.35, 'rgba(255, 190, 110, 0.18)')
    g.addColorStop(1, 'rgba(255, 170, 90, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // raios girando bem devagar
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(t * 0.05)
    ctx.globalAlpha = 0.07 + Math.sin(t * 1.3) * 0.02
    ctx.fillStyle = '#fff6d0'
    for (let i = 0; i < 12; i++) {
      ctx.rotate((Math.PI * 2) / 12)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(W * 0.9, -18)
      ctx.lineTo(W * 0.9, 18)
      ctx.fill()
    }
    ctx.restore()

    // pontinhos de luz subindo
    for (const l of luzes) {
      l.y -= l.v * dt
      if (l.y < 0.25) Object.assign(l, novaLuz(false))
      const a = 0.35 + Math.sin(t * 3 + l.fase) * 0.35
      ctx.fillStyle = `rgba(255, 240, 180, ${Math.max(0, a)})`
      ctx.beginPath()
      ctx.arc(l.x * W + Math.sin(t + l.fase) * 6, l.y * H, l.r, 0, Math.PI * 2)
      ctx.fill()
    }

    // folhas e pétalas caindo
    for (const f of folhas) {
      f.y += f.v * dt
      f.giro += f.vg * dt
      if (f.y > 1.05) Object.assign(f, novaFolha(false))
      const x = f.x * W + Math.sin(t * 1.2 + f.balanco) * 22
      const y = f.y * H
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(f.giro)
      ctx.scale(1, Math.abs(Math.cos(t * 2 + f.balanco)) * 0.7 + 0.3) // vira no ar
      ctx.fillStyle = f.cor
      ctx.beginPath()
      ctx.ellipse(0, 0, f.tam, f.tam * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-f.tam, 0)
      ctx.lineTo(f.tam, 0)
      ctx.stroke()
      ctx.restore()
    }
  }
  requestAnimationFrame(quadro)
  return {
    parar() {
      rodando = false
    },
  }
}
