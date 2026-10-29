# Juntar Frutas: lista de artes para gerar em IA (versão 2)

## Regras que valem para TODAS as imagens

1. **Cada imagem é um arquivo PNG separado**, com o nome exato da tabela.
   Prévia com tudo junto (montagem) serve só para conferir, não para usar no jogo.
2. **Fundo transparente DE VERDADE.** Nunca desenhar o xadrez cinza e branco na imagem.
   Se não conseguir transparência real, use **fundo branco liso (#FFFFFF)**, sem sombra no chão.
3. **Mesmo estilo em tudo:** 3D, brilhante, cores muito vibrantes e saturadas, luz de cima à esquerda,
   reflexo de luz forte. É o estilo da primeira leva, que foi aprovado.
4. Nada de texto dentro das imagens, a não ser no logo e nas faixas de mundo.

## Onde cada coisa vai no jogo

Tudo vai dentro de `~/Documents/jogo-frutas/public/`, respeitando as pastas dos nomes
(ex.: `frutas/mundo2/3.png` vai em `public/frutas/mundo2/3.png`).

As **frutas entram sozinhas**: o jogo apaga fundo branco, corta a sobra, centraliza e ajusta o tamanho.
O resto o Claude encaixa.

---

## 1. Frutas: 4 mundos com 10 frutas cada

O jogo agora tem **mundos**: a cada 30 fases muda o mundo, e com ele todas as frutas.
Em cada mundo as frutas vão **da menor (0) para a maior (9)**.
Não precisam ser redondas (pera, manga e carambola podem), mas precisam ter
**formato compacto**: nada comprido e fino como banana.

**Texto base de toda fruta (troque só o [FRUTA]):**

> Ultra-realistic 3D render of [FRUTA], glossy and juicy, very vibrant saturated colors, soft studio lighting from the top-left, bright specular highlight, compact shape, centered, filling most of the image, isolated on a real transparent background (if transparency is not possible, plain solid white background), no shadow, no checkerboard pattern, no text, no face, mobile game asset, 512x512

### Mundo 1: Feira (já gerado; refazer só a uva)

| Arquivo | [FRUTA] |
|---|---|
| frutas/mundo1/0.png | **a small compact round bunch of purple grapes** (refazer: a de antes parecia ameixa) |
| frutas/mundo1/1.png | one red cherry with a short stem and a small leaf |
| frutas/mundo1/2.png | one plump strawberry with green leaves on top |
| frutas/mundo1/3.png | one round green lime |
| frutas/mundo1/4.png | one round orange with a small leaf |
| frutas/mundo1/5.png | one red apple with stem and leaf |
| frutas/mundo1/6.png | one peach with a leaf |
| frutas/mundo1/7.png | one pineapple with a short green crown |
| frutas/mundo1/8.png | one round cantaloupe melon with netted skin |
| frutas/mundo1/9.png | one whole round striped watermelon |

### Mundo 2: Tropical

| Arquivo | Fruta | [FRUTA] |
|---|---|---|
| frutas/mundo2/0.png | Acerola | one small shiny red acerola cherry |
| frutas/mundo2/1.png | Jabuticaba | one glossy round dark purple jabuticaba fruit |
| frutas/mundo2/2.png | Caju | one cashew apple, yellow-red, with the cashew nut on top |
| frutas/mundo2/3.png | Maracujá | one round yellow passion fruit |
| frutas/mundo2/4.png | Goiaba | one green-yellow guava with a slightly pink blush |
| frutas/mundo2/5.png | Carambola | one whole yellow star fruit seen slightly from the end, showing its star shape |
| frutas/mundo2/6.png | Manga | one ripe mango, red-orange-yellow gradient, with a small leaf |
| frutas/mundo2/7.png | Mamão | one whole papaya, orange-green, short and plump |
| frutas/mundo2/8.png | Coco | one green coconut, round and fresh |
| frutas/mundo2/9.png | Jaca | one whole jackfruit, green spiky skin, plump and round |

### Mundo 3: Pomar

| Arquivo | Fruta | [FRUTA] |
|---|---|---|
| frutas/mundo3/0.png | Mirtilo | one round blueberry with a dusty blue skin |
| frutas/mundo3/1.png | Framboesa | one plump red raspberry |
| frutas/mundo3/2.png | Ameixa | one round dark purple plum |
| frutas/mundo3/3.png | Kiwi | one whole brown fuzzy kiwi |
| frutas/mundo3/4.png | Figo | one purple fig, plump |
| frutas/mundo3/5.png | Pera | one green-yellow pear with stem and leaf, plump bottom |
| frutas/mundo3/6.png | Limão-siciliano | one bright yellow lemon, plump |
| frutas/mundo3/7.png | Romã | one round red pomegranate with its crown |
| frutas/mundo3/8.png | Toranja | one round pink-orange grapefruit |
| frutas/mundo3/9.png | Abóbora | one round orange pumpkin with a short green stem |

### Mundo 4: Exótico

| Arquivo | Fruta | [FRUTA] |
|---|---|---|
| frutas/mundo4/0.png | Physalis | one round orange physalis berry with its papery husk opened behind it |
| frutas/mundo4/1.png | Lichia | one round red lychee with bumpy skin |
| frutas/mundo4/2.png | Rambutã | one round red rambutan with soft hairy spikes |
| frutas/mundo4/3.png | Mangostim | one round purple mangosteen with green top |
| frutas/mundo4/4.png | Kiwano | one orange horned melon (kiwano) with spikes, plump |
| frutas/mundo4/5.png | Pinha | one green sugar apple (custard apple) with bumpy scales |
| frutas/mundo4/6.png | Pitaya | one bright pink dragon fruit with green-tipped scales |
| frutas/mundo4/7.png | Melão cantalupo dourado | one round golden canary melon, bright yellow |
| frutas/mundo4/8.png | Durião | one round spiky green-yellow durian |
| frutas/mundo4/9.png | Melancia dourada | one whole round watermelon with golden-yellow and green stripes, magical sparkles |

---

## 2. Mascote: macaquinho feirante (aprovado)

**Mantenha o mesmo personagem da primeira leva:** chapéu de palha com faixa verde, avental
ou macacão verde com uma laranja no bolso. Tamanho 1024x1024.

> Cute 3D cartoon baby monkey mascot for a colorful mobile fruit puzzle game, straw hat with a green band, green apron with an orange on the pocket, big sparkly eyes, rosy cheeks, Pixar-like style, vibrant saturated colors, soft lighting, full body, isolated on a real transparent background, no text, [POSE]

| Arquivo | [POSE] | Onde aparece |
|---|---|---|
| mascote/feliz.png | waving hello, big happy smile | menu inicial |
| mascote/comemora.png | jumping with arms up, celebrating, confetti around | vitória |
| mascote/triste.png | sad face with a small tear, sitting | derrota |
| mascote/aponta.png | pointing to the side, giving a tip | dicas |
| mascote/surpreso.png | amazed face, hands on cheeks, eyes shining | fruta nova descoberta |
| mascote/segura-fruta.png | proudly holding a big shiny watermelon over his head | tela de mundo concluído |
| mascote/dorme.png | sleeping peacefully, sitting, small "z" bubbles | prêmio diário já pego |
| mascote/pensa.png | thinking, finger on chin, looking up | carregando |
| mascote/mundo2.png | wearing a flower necklace and sunglasses, tropical beach style, waving | Mundo 2 |
| mascote/mundo3.png | wearing farmer overalls and holding a basket, waving | Mundo 3 |
| mascote/mundo4.png | wearing an explorer hat and a backpack, waving | Mundo 4 |

---

## 3. Ícones (512x512)

> Glossy 3D cartoon mobile game icon of [ITEM], bright saturated colors, thick dark outline, shiny highlights, centered, isolated on a real transparent background, no text

**Já aprovados (manter iguais):** martelo, trocar, presente, mapa, som, mudo, moeda, estrela, cadeado.

**Novos:**

| Arquivo | [ITEM] | Para quê |
|---|---|---|
| icones/bomba.png | a round cartoon bomb with a lit fuse and sparks | power-up: estoura as frutas em volta |
| icones/varinha.png | a magic wand with a star tip and sparkles | power-up: transforma uma fruta na próxima |
| icones/coracao.png | a shiny red heart | vidas |
| icones/video.png | a green play button with a small film strip | "assista e ganhe" |
| icones/bau-fechado.png | a closed treasure chest, purple and gold | prêmio diário |
| icones/bau-aberto.png | an open treasure chest overflowing with gold coins and light rays | prêmio diário aberto |
| icones/pilha-moedas.png | a big pile of shiny gold coins | loja |
| icones/loja.png | a small colorful market stall with an awning | botão da loja |
| icones/config.png | a shiny gear | configurações |
| icones/trofeu.png | a golden trophy cup | conquistas |
| icones/calendario.png | a cute calendar with a gold star | missões do dia |

---

## 4. Logo (aprovado)

Manter o da primeira leva. Só garantir **fundo transparente de verdade** (`logo.png`, 1024x512).

---

## 5. Fundos (1080x1920, sem transparência)

**Aprovados:** `fundo-menu.png`, `fundo-jogo.png`. Agora um fundo de mapa **por mundo**:

> Vibrant vertical mobile game level map background seen from above, [CENÁRIO], bright saturated colors, no path, no text, no characters, vertical 9:16

| Arquivo | [CENÁRIO] |
|---|---|
| fundo-mapa-1.png | a cozy fruit market village with colorful stalls and stone streets |
| fundo-mapa-2.png | a tropical beach island with palm trees, turquoise water and coconut trees |
| fundo-mapa-3.png | a green countryside orchard with fruit trees, a red barn and hills |
| fundo-mapa-4.png | a magical jungle with giant exotic plants, waterfalls and glowing flowers |

---

## 6. Faixas de mundo (1024x400, fundo transparente)

Faixa com o nome do mundo, que aparece quando o mundo abre.

> Colorful glossy 3D game banner ribbon with the text "[NOME]", bubbly cartoon letters, thick dark outline, decorated with [ENFEITE], isolated on a real transparent background

| Arquivo | [NOME] | [ENFEITE] |
|---|---|---|
| faixas/mundo1.png | Mundo 1: Feira | apples, oranges and a market awning |
| faixas/mundo2.png | Mundo 2: Tropical | palm leaves, mangoes and coconuts |
| faixas/mundo3.png | Mundo 3: Pomar | pears, plums and green leaves |
| faixas/mundo4.png | Mundo 4: Exótico | dragon fruits, glowing sparkles and jungle leaves |

---

## 7. Peças da interface (fundo transparente)

| Arquivo | Texto para a IA |
|---|---|
| ui/janela.png (1024x1024) | Empty glossy game popup window frame, rounded, purple and gold border, light cream inside, cartoon style, no text |
| ui/fita.png (1024x256) | Empty glossy pink ribbon banner for game titles, cartoon 3D style, no text |
| ui/pote.png (720x1280) | Empty transparent glass jar seen from the front, wide, open top, glossy reflections, cartoon 3D style, no text |
| ui/brilho.png (256x256) | A single bright white sparkle star with soft glow |
| ui/suco-vermelho.png (512x512) | A juicy red splash burst of fruit juice droplets, top view, cartoon 3D |
| ui/suco-laranja.png (512x512) | the same juice splash but orange |
| ui/suco-verde.png (512x512) | the same juice splash but green |
| ui/suco-roxo.png (512x512) | the same juice splash but purple |
| ui/raios.png (1024x1024) | Golden sun rays burst from the center, soft glow, for celebration screens |

---

## 8. Ícone do app (aprovado)

Manter `icone-app.png` (1024x1024). Opcional: uma segunda versão com o macaquinho
abraçando a melancia (`icone-app-2.png`), pra testar qual dá mais clique na loja.

---

## Ordem sugerida

1. Uva nova + regerar o Mundo 1 com fundo transparente de verdade
2. Mundo 2 (próximo que o jogador vê)
3. Mascote, poses novas
4. Ícones novos e faixas de mundo
5. Mundos 3 e 4, fundos de mapa, peças da interface

---

## 9. Pedidos extras (rodada 3)

**Logo: NÃO gerar ainda.** O nome do jogo vai mudar.

### Mascote segurando fruta (o jogo coloca a fruta nas mãos dele)
| Arquivo | [POSE] (mesmo texto da seção 2) |
|---|---|
| mascote/segurando.png | standing, both arms forward at chest height with open empty hands as if holding a big invisible ball, happy smile, looking at the viewer |

### Fundo da fase, um por mundo (1080x1920, sem transparência)
> Vibrant mobile game background for a fruit puzzle level, [CENÁRIO], soft and slightly blurred so it does not distract, the center area calmer and a bit darker where the game jar goes, bright saturated colors, no characters, no text, vertical 9:16

| Arquivo | [CENÁRIO] |
|---|---|
| fundo-jogo-1.png | a cozy fruit market street at sunset with colorful stalls and string lights |
| fundo-jogo-2.png | a tropical beach with palm trees and turquoise sea |
| fundo-jogo-3.png | a green orchard with fruit trees and a red barn |
| fundo-jogo-4.png | a magical jungle with glowing flowers and waterfalls |

### Mapa novo (fundo transparente)
| Arquivo | Texto |
|---|---|
| mapa/fase-aberta.png (256x256) | Round glossy 3D game level button, golden wood with a light green center, cartoon style, empty center with no number, no text |
| mapa/fase-atual.png (256x256) | the same level button but bright glowing green with sparkles, empty center, no text |
| mapa/fase-trancada.png (256x256) | the same level button but grey stone with a small purple padlock, no text |
| mapa/pedra.png (128x128) | a single small round stepping stone seen from above, cartoon 3D |
| mapa/placa.png (512x256) | an empty wooden sign board on a post, cartoon 3D, no text |
| mapa/deco-1-a.png ... deco-1-c.png (512x512) | 3 small decorations for the fruit market map: a fruit stall, a crate of apples, a lamp post |
| mapa/deco-2-a.png ... deco-2-c.png | 3 decorations for the tropical map: a palm tree, a beach umbrella, a coconut pile |
| mapa/deco-3-a.png ... deco-3-c.png | 3 decorations for the orchard map: a pear tree, a hay bale, a wooden fence |
| mapa/deco-4-a.png ... deco-4-c.png | 3 decorations for the jungle map: a giant glowing flower, a vine-covered rock, a small waterfall |

### Obstáculos dentro do pote (fundo transparente)
| Arquivo | Texto |
|---|---|
| obstaculos/tabua.png (512x96) | a horizontal wooden plank seen from the front, cartoon 3D, glossy, no text |
| obstaculos/trampolim.png (512x160) | a bouncy red mushroom-shaped trampoline seen from the front, cartoon 3D |
| obstaculos/caixote.png (256x256) | a wooden crate, cartoon 3D, front view |
| obstaculos/caixote-rachado.png (256x256) | the same wooden crate with cracks, about to break |
| obstaculos/helice.png (512x512) | a colorful rotating pinwheel bar with two long arms, seen from the front, cartoon 3D |

---

## 10. Pendente: conferir na próxima entrega (ainda NÃO enviado à IA)

Se não vier no próximo ZIP, mandar este acréscimo:

- `icones/moeda.png` e `icones/estrela.png` (512x512): moeda dourada com estrela igual à da pilha-moedas, sozinha e de frente; estrela dourada 3D brilhante. Fundo transparente.
- `fundo-menu.png` (1080x1920, sem transparência): a feira ao pôr do sol da primeira leva (aprovada), como arquivo.
- `fundo-menu-2.png`, `fundo-menu-3.png`, `fundo-menu-4.png`: mesmo estilo, um por mundo (praia tropical, pomar, selva mágica).
- `mascote/chao.png` (1024x400, transparente): chão/palco do macaquinho no menu, uma bancada de feira de madeira com frutas nas pontas e grama, de frente e levemente de cima.

Motivo: a moeda do jogo (CSS) não combina com a da IA, e o macaquinho parece solto no menu sem fundo nem chão.

---

## 11. Rodada 7: refazer no estilo do jogo (enviado em 27/10 à noite)

Ver o prompt completo na conversa; resumo do que foi pedido:
- Frutas do Mundo 1 refeitas em estilo "cartoon 3D de jogo casual" (igual baú/loja/ícones), teste antes dos outros mundos.
- Macaquinho: recorte limpo (sem borda branca), poses aprovadas reenviadas.
- Ícones: presente, mapa, como-jogar no 3D da IA.
- Mapa: fundos nítidos, SEM estradas, em 3 partes contínuas por mundo (mapa-N-1, -2, -3), a parte de cima de uma continua na de baixo da outra.
- Pote: caixote de feira de madeira, só a moldura (centro vazio/transparente).
- Barra de cima da fase: placa de madeira e botão de voltar redondo.
