// Física do pote, usada pelo jogo e pelo robô de fases (assim os dois jogam igual).
import Matter from 'matter-js'

const { Bodies } = Matter

// Raio dos cantos de baixo, em unidades do pote. O CSS do #tela usa a mesma curva.
export const RAIO_CANTO = 58
const PEDACOS_CANTO = 6

// Chão, duas paredes e os cantos de baixo arredondados, como no desenho do vidro.
export function paredesDoPote(largura, altura) {
  const fixo = { isStatic: true }
  const corpos = [
    Bodies.rectangle(largura / 2, altura + 25, largura + 100, 50, fixo),
    Bodies.rectangle(-25, altura / 2, 50, altura * 2, fixo),
    Bodies.rectangle(largura + 25, altura / 2, 50, altura * 2, fixo),
  ]
  // cada canto vira uma sequência de tábuas grossas encostadas na curva, pelo lado de fora
  const cantos = [
    { cx: RAIO_CANTO, cy: altura - RAIO_CANTO, de: Math.PI / 2, ate: Math.PI },
    { cx: largura - RAIO_CANTO, cy: altura - RAIO_CANTO, de: 0, ate: Math.PI / 2 },
  ]
  const grossura = 40
  for (const c of cantos) {
    for (let i = 0; i < PEDACOS_CANTO; i++) {
      const a0 = c.de + ((c.ate - c.de) * i) / PEDACOS_CANTO
      const a1 = c.de + ((c.ate - c.de) * (i + 1)) / PEDACOS_CANTO
      const meio = (a0 + a1) / 2
      const corda = 2 * RAIO_CANTO * Math.sin((a1 - a0) / 2)
      // a face de dentro da tábua fica na corda; o resto vai pra fora da curva
      const d = RAIO_CANTO * Math.cos((a1 - a0) / 2) + grossura / 2
      corpos.push(
        Bodies.rectangle(c.cx + Math.cos(meio) * d, c.cy + Math.sin(meio) * d, corda + 2, grossura, {
          ...fixo,
          angle: meio + Math.PI / 2,
        }),
      )
    }
  }
  // fundo de vidro grosso, mais fundo no meio: fruta pequena não fica presa na parede,
  // volta pro meio e encontra as outras (com chão reto elas se espalhavam pelos cantos)
  const queda = (largura / 2) * Math.tan(INCLINACAO_FUNDO)
  for (const lado of [-1, 1]) {
    const ang = -lado * INCLINACAO_FUNDO
    const meioX = largura / 2 + (lado * largura) / 4
    corpos.push(
      Bodies.rectangle(
        meioX - Math.sin(ang) * 10,
        altura - queda / 2 + Math.cos(ang) * 10,
        largura / 2 / Math.cos(INCLINACAO_FUNDO) + 4,
        20,
        { ...fixo, angle: ang },
      ),
    )
  }
  return corpos
}

// Quanto o fundo desce da parede até o meio (6 graus: as frutas se encontram sem rolar sozinhas pro centro)
export const INCLINACAO_FUNDO = (6 * Math.PI) / 180
export const QUEDA_FUNDO = (330 / 2) * Math.tan(INCLINACAO_FUNDO)

