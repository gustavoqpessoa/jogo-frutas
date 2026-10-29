// Tela da loja: oferta do dia, moedas grátis por vídeo, power-ups, pacotes e visuais.
import { progresso } from './progresso.js'
import { som } from './som.js'
import { videoPremiado } from './anuncios.js'
import { PRECOS, POTES, PACOTES, PODERES, poder, ofertaDoDia, MOEDAS_POR_VIDEO, VIDEOS_POR_DIA } from './economia.js'

const moeda = (v) => `<span class="preco"><img class="ico-moeda" src="/icones/moeda.svg" alt="">${v}</span>`

function itensEmIcones(itens) {
  return Object.entries(itens)
    .map(([item, qtd]) => `<span class="item-ico"><img src="${poder(item).icone}" alt=""><b>x${qtd}</b></span>`)
    .join('')
}

function horasAteAmanha() {
  const agora = new Date()
  const amanha = new Date(agora)
  amanha.setHours(24, 0, 0, 0)
  const min = Math.floor((amanha - agora) / 60000)
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min`
}

export function montarLoja(el, { aoMudar }) {
  const oferta = ofertaDoDia()
  const vistos = progresso.videosDeHoje()
  const podeVideo = vistos < VIDEOS_POR_DIA
  const ofertaFeita = progresso.ofertaComprada()

  el.innerHTML = `
    <section class="loja-bloco oferta">
      <div class="selo">Oferta do dia</div>
      <div class="oferta-corpo">
        <div><h3>${oferta.nome}</h3><div class="oferta-itens">${itensEmIcones(oferta.itens)}</div>
          <small>Acaba em ${horasAteAmanha()}</small></div>
        <button class="btn-comprar${ofertaFeita ? ' feito' : ''}" data-oferta ${ofertaFeita ? 'disabled' : ''}>
          ${ofertaFeita ? 'Comprado' : `<s>${oferta.de}</s>${moeda(oferta.preco)}`}</button>
      </div>
    </section>

    <section class="loja-bloco gratis">
      <img src="/icones/pilha-moedas.png" alt="">
      <div><h3>Moedas grátis</h3><small>Assista um vídeo curto · ${vistos}/${VIDEOS_POR_DIA} hoje</small></div>
      <button class="btn-comprar verde${podeVideo ? '' : ' feito'}" data-video ${podeVideo ? '' : 'disabled'}>
        ${podeVideo ? `<img class="ico-video" src="/icones/video.png" alt="">${moeda('+' + MOEDAS_POR_VIDEO)}` : 'Amanhã tem mais'}</button>
    </section>

    <h4 class="loja-titulo">Power-ups</h4>
    <div class="loja-grade">
      ${PODERES.map((p) =>
        progresso.liberada < p.libera
          ? `<div class="cartao-loja breve"><img src="${p.icone}" alt="" style="filter:grayscale(1) opacity(.5)"><b>${p.nome}</b><small>Chega na fase ${p.libera}</small></div>`
          : `<button class="cartao-loja" data-poder="${p.id}">
            <span class="tem">tem ${progresso[p.id]}</span>
            <img src="${p.icone}" alt=""><b>${p.nome}</b>${moeda(PRECOS[p.id])}</button>`,
      ).join('')}
      ${PACOTES.map(
        (p) => `<button class="cartao-loja pacote" data-pacote="${p.id}">
          <span class="tem desconto">-${Math.round((1 - p.preco / (PRECOS[Object.keys(p.itens)[0]] * Object.values(p.itens)[0])) * 100)}%</span>
          <div class="oferta-itens">${itensEmIcones(p.itens)}</div><b>${p.nome}</b>${moeda(p.preco)}</button>`,
      ).join('')}
    </div>

    <h4 class="loja-titulo">Visual do pote</h4>
    <div class="loja-grade">
      ${POTES.map((p) => {
        const tem = progresso.temPote(p.id)
        const usando = progresso.pote === p.id
        return `<button class="cartao-loja${usando ? ' usando' : ''}" data-pote="${p.id}">
          <span class="mini-jarro vaso"><i class="mini-vidro pote-${p.id}"></i><i class="moldura"></i><i class="aro"></i></span><b>${p.nome}</b>
          ${usando ? '<span class="preco ok">Usando</span>' : tem ? '<span class="preco ok">Usar</span>' : moeda(p.preco)}</button>`
      }).join('')}
    </div>

    <h4 class="loja-titulo">Em breve</h4>
    <div class="loja-grade">
      <div class="cartao-loja breve"><span class="cadeado">🔒</span><b>Roupas do macaquinho</b></div>
      <div class="cartao-loja breve"><span class="cadeado">🔒</span><b>Fundos especiais</b></div>
    </div>`

  const avisoSemMoedas = (botao) => {
    botao.classList.add('nao-deu')
    setTimeout(() => botao.classList.remove('nao-deu'), 500)
  }
  const comprou = () => {
    som.vitoria()
    aoMudar()
  }

  el.querySelector('[data-oferta]')?.addEventListener('click', (e) => {
    if (progresso.receberItens(oferta.itens, oferta.preco, true)) comprou()
    else avisoSemMoedas(e.currentTarget)
  })
  el.querySelector('[data-video]')?.addEventListener('click', async () => {
    if (!(await videoPremiado())) return
    progresso.contarVideo(MOEDAS_POR_VIDEO)
    comprou()
  })
  el.querySelectorAll('[data-poder]').forEach((b) =>
    b.addEventListener('click', () => {
      const item = b.dataset.poder
      if (progresso.receberItens({ [item]: 1 }, PRECOS[item])) comprou()
      else avisoSemMoedas(b)
    }),
  )
  el.querySelectorAll('[data-pacote]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = PACOTES.find((x) => x.id === b.dataset.pacote)
      if (progresso.receberItens(p.itens, p.preco)) comprou()
      else avisoSemMoedas(b)
    }),
  )
  el.querySelectorAll('[data-pote]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = POTES.find((x) => x.id === b.dataset.pote)
      if (progresso.temPote(p.id)) {
        progresso.usarPote(p.id)
        som.juntar(2)
        aoMudar()
      } else if (progresso.pagar(p.preco)) {
        progresso.ganharPote(p.id)
        comprou()
      } else avisoSemMoedas(b)
    }),
  )
}
