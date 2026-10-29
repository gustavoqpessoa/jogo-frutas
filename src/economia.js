// Regras de moedas e estrelas. Ajustar preço/recompensa é só mexer aqui.

// Estrelas que precisa ter pra entrar em cada mundo (cada fase dá até 3).
export const ESTRELAS_DO_MUNDO = { 1: 0, 2: 60, 3: 130, 4: 200 }

// Moedas por vitória: na primeira vez, mais as estrelas novas.
// As 10 primeiras fases pagam em dobro: o jogador novo já consegue comprar algo e conhecer a loja.
export const MOEDAS_INICIAIS = 200
export const MOEDAS_PRIMEIRA_VEZ = 20
export const MOEDAS_POR_ESTRELA = 10
export const FASES_COM_BONUS = 10
export function moedasDaVitoria(n, primeiraVez, estrelasNovas) {
  const moedas = (primeiraVez ? MOEDAS_PRIMEIRA_VEZ : 0) + estrelasNovas * MOEDAS_POR_ESTRELA
  return n <= FASES_COM_BONUS ? moedas * 2 : moedas
}

// A cada tantas estrelas, abre um baú.
export const ESTRELAS_POR_BAU = 20

// Power-ups custam mais que visuais de propósito: assim compensa mais ver vídeo.
export const PRECOS = {
  martelos: 350,
  trocas: 250,
  bombas: 450,
  varinhas: 400,
  continuar: 200, // +5 frutas ao perder, sem ver vídeo
}

// Power-ups. Os novos vão sendo liberados conforme avança: aparecem a partir da fase
// "libera", com um aviso e alguns de presente.
export const PODERES = [
  { id: 'martelos', nome: 'Martelo', icone: '/icones/martelo.svg', libera: 1, dica: 'Qual fruta vai quebrar?' },
  { id: 'trocas', nome: 'Trocar', icone: '/icones/trocar.svg', libera: 1 },
  { id: 'bombas', nome: 'Bomba', icone: '/icones/bomba.png', libera: 11, presente: 2, dica: 'Onde a bomba vai estourar?',
    explica: 'Estoura a fruta tocada e as que estiverem em volta.' },
  { id: 'varinhas', nome: 'Varinha', icone: '/icones/varinha.png', libera: 21, presente: 2, dica: 'Qual fruta vai crescer?',
    explica: 'Transforma a fruta tocada na fruta seguinte da fileira.' },
]
export const poder = (id) => PODERES.find((p) => p.id === id)

// Visuais do pote (o do mascote entra quando a arte chegar).
export const POTES = [
  { id: 'vidro', nome: 'Vidro', preco: 0 },
  { id: 'madeira', nome: 'Madeira', preco: 150 },
  { id: 'arco-iris', nome: 'Arco-íris', preco: 200 },
  { id: 'ouro', nome: 'Ouro', preco: 250 },
  { id: 'neon', nome: 'Neon', preco: 300 },
  { id: 'gelo', nome: 'Gelo', preco: 350 },
]

// O que sai num baú: moedas sempre, às vezes um power-up.
export function sortearBau(faseAtual = 1) {
  const moedas = 60 + Math.floor(Math.random() * 5) * 20
  const sorte = Math.random()
  if (sorte >= 0.7) return { moedas, extra: null }
  // só sai power-up que o jogador já liberou
  const liberados = PODERES.filter((p) => p.libera <= faseAtual)
  return { moedas, extra: liberados[Math.floor(Math.random() * liberados.length)].id }
}

// Pacotes da loja: sai mais barato que comprar um por um.
export const PACOTES = [
  { id: 'pac-martelos', nome: '3 Martelos', itens: { martelos: 3 }, preco: 900 },
  { id: 'pac-trocas', nome: '3 Trocas', itens: { trocas: 3 }, preco: 650 },
]

// Oferta do dia: muda a cada dia, com preço "de/por".
const OFERTAS = [
  { nome: 'Kit Iniciante', itens: { martelos: 2, trocas: 2 }, preco: 600, de: 1200 },
  { nome: 'Kit Marreta', itens: { martelos: 4 }, preco: 900, de: 1400 },
  { nome: 'Kit Troca-Troca', itens: { trocas: 5 }, preco: 800, de: 1250 },
]
export function ofertaDoDia() {
  const dia = Math.floor(Date.now() / 86400000)
  return OFERTAS[dia % OFERTAS.length]
}

// Moedas grátis assistindo vídeo, com limite por dia.
export const MOEDAS_POR_VIDEO = 60
export const VIDEOS_POR_DIA = 5
