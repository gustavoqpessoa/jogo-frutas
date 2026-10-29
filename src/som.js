// Sons gerados na hora (sem arquivo). O "pop" fica mais grave quanto maior a fruta.
let ctx = null
let ligado = localStorage.getItem('jogo-frutas:som') !== 'nao'
let vibra = localStorage.getItem('jogo-frutas:vibrar') !== 'nao'

function vibrar(padrao) {
  if (vibra && navigator.vibrate) navigator.vibrate(padrao)
}

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tom(freq, duracao, tipo = 'sine', volume = 0.2) {
  if (!ligado) return
  const a = audio()
  const osc = a.createOscillator()
  const ganho = a.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(freq, a.currentTime)
  osc.frequency.exponentialRampToValueAtTime(freq * 1.6, a.currentTime + duracao * 0.6)
  ganho.gain.setValueAtTime(volume, a.currentTime)
  ganho.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duracao)
  osc.connect(ganho).connect(a.destination)
  osc.start()
  osc.stop(a.currentTime + duracao)
}

export const som = {
  get ligado() {
    return ligado
  },
  alternar() {
    ligado = !ligado
    try {
      localStorage.setItem('jogo-frutas:som', ligado ? 'sim' : 'nao')
    } catch {}
    return ligado
  },
  get vibra() {
    return vibra
  },
  alternarVibrar() {
    vibra = !vibra
    try {
      localStorage.setItem('jogo-frutas:vibrar', vibra ? 'sim' : 'nao')
    } catch {}
    if (vibra) vibrar(30)
    return vibra
  },
  soltar() {
    tom(520, 0.08, 'triangle', 0.08)
  },
  juntar(nivel) {
    tom(880 - nivel * 60, 0.18, 'sine', 0.22)
    vibrar(12)
  },
  combo(n) {
    const base = 660 * 2 ** (Math.min(n, 8) / 12)
    tom(base, 0.12, 'square', 0.06)
    setTimeout(() => tom(base * 1.5, 0.15, 'square', 0.06), 70)
  },
  vitoria() {
    ;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tom(f, 0.25, 'triangle', 0.15), i * 110))
    vibrar([20, 40, 20])
  },
  derrota() {
    ;[392, 330, 262].forEach((f, i) => setTimeout(() => tom(f, 0.3, 'sawtooth', 0.06), i * 150))
  },
}
