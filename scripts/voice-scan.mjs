/* Scans the RENDERED text a visitor sees — not the file bytes (base64 image
   data produces false-positive hits for short agency abbreviations). */
import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ reducedMotion: 'reduce' })).newPage()
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await p.waitForSelector('.facts-panel')
const text = await p.evaluate(() => document.body.innerText)
const terms = ['FDA', 'Food and Drug', 'FTC', 'DSHEA', 'MedWatch', '21 CFR', 'disease', 'claim', 'not evaluated']
const sentences = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
for (const t of terms) {
  const hits = sentences.filter((s) => s.toLowerCase().includes(t.toLowerCase()))
  console.log(`${t.padEnd(14)} ${String(hits.length).padStart(2)}  ${hits.length ? '→ ' + hits[0].slice(0, 118) : ''}`)
}
console.log(`\nvisible copy: ${sentences.length} lines, ${text.length.toLocaleString()} chars`)
await b.close()
