// Progresso do jogador, salvo no aparelho.
import { MOEDAS_INICIAIS, moedasDaVitoria } from './economia.js'
const CHAVE = 'jogo-frutas:progresso'
const INICIAL = { liberada: 1, estrelas: {}, moedas: MOEDAS_INICIAIS, martelos: 2, trocas: 2, bombas: 0, varinhas: 0, poderesVistos: [], premioDiario: '', mundosVistos: [1], bausAbertos: 0, potes: ['vidro'], pote: 'vidro', videosDia: '', videosHoje: 0, ofertaDia: '' }

function ler() {
  try {
    return { ...INICIAL, ...JSON.parse(localStorage.getItem(CHAVE)) }
  } catch {
    return { ...INICIAL }
  }
}

let dados = ler()

// Atalho de teste (só no modo de desenvolvimento): ?fase=32 no endereço libera até
// essa fase, dá 2 estrelas nas anteriores que ainda não têm e salva.
if (import.meta.env.DEV) {
  const n = Number(new URLSearchParams(location.search).get('fase'))
  if (n > 1) {
    for (let i = 1; i < n; i++) if (!dados.estrelas[i]) dados.estrelas[i] = 2
    dados.liberada = n
    localStorage.setItem(CHAVE, JSON.stringify(dados))
    history.replaceState(null, '', location.pathname)
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados))
  } catch {}
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export const progresso = {
  get liberada() {
    return dados.liberada
  },
  get moedas() {
    return dados.moedas
  },
  get martelos() {
    return dados.martelos
  },
  get trocas() {
    return dados.trocas
  },
  get bombas() {
    return dados.bombas
  },
  get varinhas() {
    return dados.varinhas
  },
  viuPoder(id) {
    return dados.poderesVistos.includes(id)
  },
  marcarPoder(id) {
    if (!dados.poderesVistos.includes(id)) dados.poderesVistos.push(id)
    salvar()
  },
  estrelasDa(n) {
    return dados.estrelas[n] || 0
  },
  totalEstrelas() {
    return Object.values(dados.estrelas).reduce((a, b) => a + b, 0)
  },
  // devolve quantas moedas ganhou
  concluir(n, estrelas) {
    const primeiraVez = !dados.estrelas[n]
    const ganho = moedasDaVitoria(n, primeiraVez, Math.max(0, estrelas - (dados.estrelas[n] || 0)))
    dados.estrelas[n] = Math.max(dados.estrelas[n] || 0, estrelas)
    dados.liberada = Math.max(dados.liberada, n + 1)
    dados.moedas += ganho
    salvar()
    return ganho
  },
  ganhar(item, qtd) {
    dados[item] += qtd
    salvar()
  },
  gastar(item) {
    if (dados[item] <= 0) return false
    dados[item]--
    salvar()
    return true
  },
  viuMundo(m) {
    return dados.mundosVistos.includes(m)
  },
  marcarMundo(m) {
    if (!dados.mundosVistos.includes(m)) dados.mundosVistos.push(m)
    salvar()
  },
  // baús: um a cada N estrelas; devolve quantos estão esperando pra abrir
  bausProntos(porBau) {
    return Math.floor(this.totalEstrelas() / porBau) - dados.bausAbertos
  },
  abrirBau(premio) {
    dados.bausAbertos++
    dados.moedas += premio.moedas
    if (premio.extra) dados[premio.extra]++
    salvar()
  },
  pagar(preco) {
    if (dados.moedas < preco) return false
    dados.moedas -= preco
    salvar()
    return true
  },
  get pote() {
    return dados.pote
  },
  temPote(id) {
    return dados.potes.includes(id)
  },
  ganharPote(id) {
    if (!dados.potes.includes(id)) dados.potes.push(id)
    dados.pote = id
    salvar()
  },
  usarPote(id) {
    dados.pote = id
    salvar()
  },
  videosDeHoje() {
    return dados.videosDia === hoje() ? dados.videosHoje : 0
  },
  contarVideo(moedas) {
    if (dados.videosDia !== hoje()) {
      dados.videosDia = hoje()
      dados.videosHoje = 0
    }
    dados.videosHoje++
    dados.moedas += moedas
    salvar()
  },
  ofertaComprada() {
    return dados.ofertaDia === hoje()
  },
  receberItens(itens, preco, oferta = false) {
    if (dados.moedas < preco) return false
    dados.moedas -= preco
    for (const [item, qtd] of Object.entries(itens)) dados[item] += qtd
    if (oferta) dados.ofertaDia = hoje()
    salvar()
    return true
  },
  premioDiarioDisponivel() {
    return dados.premioDiario !== hoje()
  },
  pegarPremioDiario() {
    if (!this.premioDiarioDisponivel()) return 0
    dados.premioDiario = hoje()
    dados.moedas += 50
    salvar()
    return 50
  },
}
