// Anúncios SIMULADOS. Quando virar app, este arquivo passa a chamar o AdMob
// e o resto do jogo não muda.
const FASES_ENTRE_INTERSTICIAIS = 2
let fasesDesdeUltimo = 0

function telaFalsa(texto, segundos) {
  return new Promise((resolve) => {
    const el = document.createElement('div')
    el.className = 'anuncio-falso'
    el.innerHTML = `<div>${texto}</div><small>anúncio simulado</small><b>${segundos}</b>`
    document.body.appendChild(el)
    const contador = el.querySelector('b')
    let falta = segundos
    const t = setInterval(() => {
      falta--
      contador.textContent = falta
      if (falta <= 0) {
        clearInterval(t)
        el.remove()
        resolve()
      }
    }, 1000)
  })
}

// Tela cheia entre fases (a cada 2 fases concluídas).
export async function talvezIntersticial() {
  fasesDesdeUltimo++
  if (fasesDesdeUltimo < FASES_ENTRE_INTERSTICIAIS) return
  fasesDesdeUltimo = 0
  await telaFalsa('Anúncio entre fases', 3)
}

// Vídeo premiado: devolve true se a pessoa assistiu até o fim.
export async function videoPremiado() {
  await telaFalsa('Vídeo premiado', 4)
  return true
}
