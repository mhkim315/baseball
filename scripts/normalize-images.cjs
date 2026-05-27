const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/user/Pictures/character';
const dstDir = 'C:/Users/user/Documents/baseball_app/client/public/team-characters';
const WIDTH = 200;
const EMOTIONS = [
  'default', 'determined', 'sad', 'joyful', 'neutral',
  'angry', 'furious', 'shocked',
  'annoyed', 'crying', 'curious', 'depressed',
  'flustered', 'mocking', 'sleepy', 'tongue',
  'in_love', 'extream_shock',
  'devastated', 'hot_summer', 'karen', 'out', 'praying',
  'rain_cancellation', 'resigned_disgust', 'thumbs_up', 'provocative',
];

const teamMap = {
  DOOSAN: 'doosan', LG: 'lg', KT: 'kt', SSG: 'ssg', NC: 'nc',
  SAMSUNG: 'samsung', LOTTE: 'lotte', HANHWA: 'hanwha', KIA: 'kia', KIWOOM: 'kiwoom'
};

async function process() {
  // Clear existing PNGs from dst
  if (fs.existsSync(dstDir)) {
    fs.readdirSync(dstDir).forEach(f => {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(dstDir, f));
    });
  }

  for (const [folder, teamId] of Object.entries(teamMap)) {
    for (const emotion of EMOTIONS) {
      const src = path.join(srcDir, folder, folder + '_' + emotion + '.png');
      if (!fs.existsSync(src)) {
        console.log('MISSING: ' + src);
        continue;
      }
      const dst = path.join(dstDir, teamId + '_' + emotion + '.png');
      const meta = await sharp(src).metadata();
      const newHeight = Math.round(WIDTH * meta.height / meta.width);
      await sharp(src)
        .resize(WIDTH, newHeight, { fit: 'fill' })
        .png()
        .toFile(dst);
      console.log(teamId + '_' + emotion + '.png -> ' + WIDTH + 'x' + newHeight);
    }
  }
}

process().catch(console.error);
