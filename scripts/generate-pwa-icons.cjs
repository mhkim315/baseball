const sharp = require("sharp");
const path = require("path");

const dstDir = "C:/Users/user/Documents/baseball_app/client/public";
const coral = "#f97316";
const white = "#ffffff";
const sizes = [192, 512];

async function generateIcon(size) {
  // Create an SVG with rounded rect background + "FC" text
  const pad = Math.round(size * 0.18);
  const fontSize = Math.round(size * 0.42);
  const radius = Math.round(size * 0.22);
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
      <text x="${size / 2}" y="${size / 2 + fontSize * 0.02}"
            font-family="system-ui, sans-serif"
            font-size="${fontSize}px"
            font-weight="800"
            fill="${white}"
            text-anchor="middle"
            dominant-baseline="central">FC</text>
    </svg>`;

  const dst = path.join(dstDir, `pwa-${size}x${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(dst);
  console.log(`pwa-${size}x${size}.png created`);
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size);
  }
}

main().catch(console.error);
