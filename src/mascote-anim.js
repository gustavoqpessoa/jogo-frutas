// Macaquinho animado da tela inicial, sem recortar a imagem: a pose inteira
// respira e balança; de tempos em tempos (e quando é tocado) ele dá um pulo e
// troca de pose lá no alto, caindo com uma amassadinha.
// Imagens em 1024x1024 (public/mascote/hd).

function carregar(src) {
  return new Promise((ok) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = () => ok(null)
    img.src = src
  })
}

export function animarMascote(canvas, { aoTocar } = {}) {
  const ctx = canvas.getContext('2d')
  const L = canvas.width // o macaquinho tem L x L, encostado embaixo
  const A = canvas.height // altura total: o que sobra em cima é espaço pro pulo
  const topo = A - L
  const poses = {} // nome -> imagem
  let base = 'feliz' // pose de descanso
  let extras = [] // poses que aparecem nos pulos
  let atual = 'feliz'
  let pulo = 0 // 0..1 enquanto pula
  let poseDoPulo = null
  let voltaEm = 0 // quando volta pra pose de descanso
  let proximoPulo = performance.now() + 4000
  const inicio = performance.now()

  async function usarPose(nome, outras = []) {
    const nomes = [nome, ...outras]
    await Promise.all(
      nomes.filter((n) => !poses[n]).map(async (n) => {
        const img = await carregar(`/mascote/hd/${n}.png`)
        if (img) poses[n] = img
      }),
    )
    base = nome
    atual = nome
    extras = outras.filter((n) => poses[n])
  }

  function pular(pose) {
    if (pulo > 0) return
    pulo = 0.0001
    poseDoPulo = pose
  }

  function quadro(agora) {
    requestAnimationFrame(quadro)
    const img = poses[atual]
    if (!img) return
    const t = (agora - inicio) / 1000

    // pulo automático de vez em quando, trocando pra uma pose extra
    if (agora >= proximoPulo && extras.length) {
      pular(extras[Math.floor(Math.random() * extras.length)])
      proximoPulo = agora + 5500 + Math.random() * 3000
    }
    if (voltaEm && agora >= voltaEm) {
      voltaEm = 0
      pular(base)
    }

    // pulo: agacha, sobe, troca de pose no alto, cai e amassa
    let sobe = 0
    let amassa = 0
    if (pulo > 0) {
      pulo += 1 / 42
      const p = Math.min(pulo, 1)
      if (p < 0.15) amassa = Math.sin((p / 0.15) * Math.PI) * 0.07 // agachadinha
      else if (p < 0.85) {
        const q = (p - 0.15) / 0.7
        sobe = Math.sin(q * Math.PI) * L * 0.1
        amassa = -0.05 * Math.sin(q * Math.PI) // estica no ar
        if (q >= 0.5 && poseDoPulo && atual !== poseDoPulo) {
          atual = poseDoPulo
          if (atual !== base) voltaEm = agora + 1600
        }
      } else amassa = Math.sin(((p - 0.85) / 0.15) * Math.PI) * 0.08 // chegada
      if (pulo >= 1) pulo = 0
    }

    const respira = Math.sin(t * 2.4) * 0.012
    const balanco = pulo > 0 ? 0 : Math.sin(t * 1.2) * 0.025
    const sx = 1 + amassa + respira * 0.4
    const sy = 1 - amassa + respira

    ctx.clearRect(0, 0, L, A)
    ctx.save()
    ctx.translate(L / 2, topo + L * 0.93 - sobe)
    ctx.rotate(balanco)
    ctx.scale(sx, sy)
    ctx.translate(-L / 2, -(topo + L * 0.93))
    ctx.drawImage(img, 0, topo, L, L)
    ctx.restore()
  }

  canvas.addEventListener('pointerdown', () => {
    if (pulo > 0) return
    pular(extras.length ? extras[Math.floor(Math.random() * extras.length)] : base)
    aoTocar?.()
  })

  requestAnimationFrame(quadro)
  return { usarPose }
}
