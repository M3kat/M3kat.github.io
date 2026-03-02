# Micah Blanton — Portfolio

A single-page portfolio with an **LSD-inspired** look: P5.js background (morphing blobs, particles, wave ribbons, mouse-reactive glow) and trippy typography/UI.

## Contents

- Resume-derived sections: Summary, Highlighted Projects, Core Competencies, Professional Experience, Education, Certifications, Honors & Activities
- Contact: **MicahBlanton86@gmail.com**
- Links to Starfish Space, StarCloud, Experiential Technologies, CompuCom, Intel, Williams Signal, Atmosphere TV

## Run locally

Open `index.html` in a browser (double-click or “Open with” your browser).  
Or serve the folder, e.g.:

```bash
# Python 3
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080` (or the port shown).

## Stack

- **P5.js** (CDN) — canvas background
- **HTML/CSS** — layout, Syne + Space Grotesk fonts, gradient text, glitch effect, hover states

## Customize

- **sketch.js** — blob count/size, particle count, wave speed, colors (HSB)
- **styles.css** — `--rainbow-*` and `--bg-dark` for palette
- **index.html** — copy, links, sections
