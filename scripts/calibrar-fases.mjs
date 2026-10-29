// Calibra quantas frutas cada fase dá: o robô joga e a quantidade sobe ou desce
// até a fase ficar na faixa de dificuldade certa. Grava src/calibragem.js.
// Uso: node scripts/calibrar-fases.mjs
import fs from 'node:fs'
import { gerarFase, TOTAL_FASES } from '../src/fases.js'
import { taxaDeVitoria } from './robo.mjs'

const TENTATIVAS = 40
// faixa com margem: a física tem acaso, então mira um pouco acima do mínimo
const faixa = (fase) => (fase.n <= 5 ? [0.85, 1] : fase.chefe ? [0.38, 0.62] : [0.62, 0.86])

const resultado = {}
for (let n = 1; n <= TOTAL_FASES; n++) {
  const fase = gerarFase(n, { cru: true })
  const [min, max] = faixa(fase)
  let frutas = fase.frutas
  let taxa = 0
  for (let volta = 0; volta < 12; volta++) {
    // dois conjuntos de jogadas (o 1 fica reservado pra conferência final)
    const f = { ...fase, frutas }
    taxa = (taxaDeVitoria(f, TENTATIVAS / 2, 0).taxa + taxaDeVitoria(f, TENTATIVAS / 2, 2).taxa) / 2
    if (taxa < min) frutas += Math.max(1, Math.round(frutas * 0.1))
    else if (taxa > max && frutas > 6) frutas -= Math.max(1, Math.round(frutas * 0.06))
    else break
  }
  resultado[n] = frutas
  console.log(`${String(n).padStart(3)} ${fase.meta.tipo.padEnd(7)}${fase.chefe ? ' CHEFE' : '      '} ${String(fase.frutas).padStart(2)} -> ${String(frutas).padStart(2)} frutas  (robô ganha ${Math.round(taxa * 100)}%)`)
}

fs.writeFileSync(
  new URL('../src/calibragem.js', import.meta.url),
  `// Gerado por scripts/calibrar-fases.mjs: quantas frutas cada fase dá,\n// testado pelo robô pra ficar difícil na medida. Não editar à mão.\nexport const FRUTAS_CALIBRADAS = ${JSON.stringify(resultado)}\n`,
)
console.log('\\ncalibragem gravada em src/calibragem.js')
