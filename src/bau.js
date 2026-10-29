// Animação de abrir baú: ele cai, treme esperando o toque, a tampa abre com
// luz e moedas voando, e só então aparecem os prêmios.
import { som } from './som.js'
import { poder } from './economia.js'

// arte do baú (gerada em IA): fechado treme, aberto aparece no toque
const BAU = `<i class="bau-luz"></i><img class="bau-img" src="/icones/bau-fechado.png" alt="">`

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

// premio: { moedas, extra } · extra é o id de um power-up (economia.js)
export function animarBau(premio, titulo = 'Baú de estrelas') {
  return new Promise((resolve) => {
    const tela = document.createElement('div')
    tela.className = 'cena-bau'
    tela.innerHTML = `
      <div class="raios cena-raios"></div>
      <div class="cena-titulo">${titulo}</div>
      <div class="bau-palco">${BAU}</div>
      <div class="cena-dica">Toque pra abrir!</div>
      <div class="cena-premios"></div>`
    document.body.appendChild(tela)
    const palco = tela.querySelector('.bau-palco')
    let aberto = false

    tela.onclick = async () => {
      if (aberto) return
      aberto = true
      tela.querySelector('.cena-dica').remove()
      palco.classList.add('abrindo')
      som.combo(3)
      await espera(450)
      palco.querySelector('.bau-img').src = '/icones/bau-aberto.png'
      palco.classList.add('aberto')
      som.vitoria()
      // moedas voando pra fora
      for (let i = 0; i < 18; i++) {
        const m = document.createElement('img')
        m.src = '/icones/moeda.svg' // mesma moeda com estrela do resto do jogo
        m.alt = ''
        m.className = 'moeda-voa'
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
        const dist = 120 + Math.random() * 120
        m.style.setProperty('--dx', `${Math.cos(ang) * dist}px`)
        m.style.setProperty('--dy', `${Math.sin(ang) * dist}px`)
        m.style.animationDelay = `${i * 0.03}s`
        palco.appendChild(m)
      }
      await espera(700)
      const premios = tela.querySelector('.cena-premios')
      const extra = premio.extra
        ? `<div class="carta" style="animation-delay:.2s"><img src="${poder(premio.extra).icone}" alt=""><b>+1</b><small>${poder(premio.extra).nome}</small></div>`
        : ''
      premios.innerHTML = `<div class="cartas">
          <div class="carta"><img class="ico-moeda grande-moeda" src="/icones/moeda.svg" alt=""><b>+${premio.moedas}</b><small>moedas</small></div>${extra}
        </div>
        <button class="btn principal">Pegar</button>`
      premios.querySelector('button').onclick = (e) => {
        e.stopPropagation()
        tela.classList.add('saindo')
        setTimeout(() => {
          tela.remove()
          resolve()
        }, 250)
      }
    }
  })
}
