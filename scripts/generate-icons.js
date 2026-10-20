import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const inputImg = 'public/assets/aistudio/IMG-20261019-WA0005_826b9955.jpg';
  const meta = await sharp(inputImg).metadata();
  console.log('Image dimensions:', meta.width, meta.height);

  // The receipt has a crest on top left: "الاتحاد الرياضي بتطاوين 1935 UST"
  // Let's crop the crest area or create a crisp brand crest
  // In the receipt image (approx 1600x1067), the crest is around x: 50..300, y: 15..280
  const crestCrop = await sharp(inputImg)
    .extract({
      left: Math.round(meta.width * 0.05),
      top: Math.round(meta.height * 0.015),
      width: Math.round(meta.width * 0.17),
      height: Math.round(meta.height * 0.24)
    })
    .toBuffer();

  await sharp(crestCrop)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile('public/ust-logo.png');

  // PWA 512x512 with beautiful UST club red/blue circular background or card
  await sharp(crestCrop)
    .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile('public/pwa-512x512.png');

  // 192x192
  await sharp('public/pwa-512x512.png')
    .resize(192, 192)
    .toFile('public/pwa-192x192.png');

  // maskable 512x512 (with 15% padding)
  await sharp(crestCrop)
    .resize(340, 340, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({
      top: 86,
      bottom: 86,
      left: 86,
      right: 86,
      background: { r: 185, g: 28, b: 28, alpha: 1 } // UST Crimson Red
    })
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  // apple-touch-icon
  await sharp('public/pwa-192x192.png')
    .resize(180, 180)
    .toFile('public/apple-touch-icon.png');

  console.log('PWA icons generated successfully!');
}

generate().catch(console.error);
