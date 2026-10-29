// Tira o contorno claro que a IA deixa em volta dos recortes (halo branco).
// Uso: node scripts/limpar-borda.mjs public/mascote/*.png
import fs from 'node:fs'
import { PNG } from 'pngjs'

for (const arquivo of process.argv.slice(2)) {
  const png = PNG.sync.read(fs.readFileSync(arquivo))
  const { width: w, height: h, data: px } = png
  // encolhe a borda 2 vezes (1px cada)
  for (let vez = 0; vez < 2; vez++) {
    const alfa = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) alfa[i] = px[i * 4 + 3]
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!alfa[i]) continue
        const menor = Math.min(alfa[i - 1], alfa[i + 1], alfa[i - w], alfa[i + w])
        if (menor < alfa[i]) px[i * 4 + 3] = menor
      }
  }
  // o que sobrar de claro e meio transparente na beirada some
  for (let i = 0; i < w * h; i++) {
    const a = px[i * 4 + 3]
    if (a > 0 && a < 230 && px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2] > 560) px[i * 4 + 3] = 0
  }
  fs.writeFileSync(arquivo, PNG.sync.write(png))
  console.log('limpo:', arquivo)
}
