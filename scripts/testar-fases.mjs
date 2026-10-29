// Relatório: o robô joga todas as fases e diz se dá pra ganhar.
// Uso: node scripts/testar-fases.mjs [tentativas] [primeira] [ultima]
import { gerarFase, TOTAL_FASES } from '../src/fases.js'
import { taxaDeVitoria } from './robo.mjs'

const tentativas = Number(process.argv[2] || 10)
const primeira = Number(process.argv[3] || 1)
const ultima = Number(process.argv[4] || TOTAL_FASES)
const ruins = []
for (let n = primeira; n <= ultima; n++) {
  const fase = gerarFase(n)
  const { taxa, ganhou, motivos } = taxaDeVitoria(fase, tentativas, 1)
  console.log(`${String(n).padStart(3)} ${fase.meta.tipo.padEnd(7)} ${fase.formato.padEnd(8)}${fase.tempo ? ' tempo' : '      '}${fase.chefe ? ' CHEFE' : '      '} frutas ${String(fase.frutas).padStart(2)}  ganhou ${ganhou}/${tentativas} ${JSON.stringify(motivos)}`)
  if (taxa < (fase.chefe ? 0.25 : 0.45)) ruins.push(n)
}
console.log('\nFASES DIFÍCEIS DEMAIS:', ruins.length ? ruins.join(', ') : 'nenhuma')
