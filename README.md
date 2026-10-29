# 🍓 Jogo das Frutas (nome provisório)

> **🚧 Em desenvolvimento.** Jogo casual para celular, feito com IA (Claude Code para o código e IA de imagem para as artes).
> Ele vai virar app de Android e iOS com anúncios. Por enquanto roda no navegador.

## Como funciona

Você solta frutas num pote, e duas frutas iguais se juntam numa fruta maior.
Cada fase tem uma meta (criar uma certa fruta, bater um tempo, vencer o chefe) e um limite de frutas.
Seu desempenho vale de 1 a 3 estrelas.

- **4 mundos, 120 fases.** Cada mundo tem 10 frutas próprias, um fundo e um mapa.
- **Física com o contorno real de cada fruta** ([Matter.js](https://brm.io/matter-js/)).
- **Economia:** as estrelas liberam mundos e baús, e as moedas compram power-ups, potes e continues.
- **Fases geradas com metas variadas** e um chefe a cada 10 fases. Elas são calibradas por um robô que joga cada fase sozinho (`scripts/robo.mjs`).

## Como rodar

```bash
npm install
npm run dev            # abre no navegador
npm run testar-fases   # robô joga todas as fases e aponta as impossíveis
```

Atalho de teste: `?fase=N` na URL abre direto a fase N.

## Estrutura

```
src/fases.js       geração das 120 fases
src/partida.js     regras da partida
src/frutas.js      frutas e física
src/economia.js    estrelas, moedas, baús
src/anuncios.js    anúncios (simulados por enquanto)
scripts/           ferramentas de calibragem e de montagem dos mapas
IMAGENS-IA.md      os prompts usados para gerar as artes
```

## Próximos passos

- Escolher o nome definitivo.
- Terminar os mapas dos mundos 3 e 4.
- Empacotar com Capacitor e AdMob para as lojas.
