/**
 * Resize an image File in the browser before upload → data URL.
 * Logos keep PNG (transparency) when the source is PNG; everything else is
 * JPEG. Quality steps down until the result fits the server's 1.5 MB cap.
 */
const MAX_BYTES = 1.4 * 1024 * 1024;

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Сликата не може да се отвори.')); };
  img.src = url;
});

const bytesOf = (dataUrl) => Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

export async function resizeImage(file, { maxWidth, maxHeight, keepPng = false }) {
  if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error('Изберете JPG, PNG или WebP слика.');
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('Сликата е преголема (најмногу 15 MB).');
  const img = await loadImage(file);
  const scale = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const png = keepPng && file.type === 'image/png';
  if (!png) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  if (png) {
    const out = canvas.toDataURL('image/png');
    if (bytesOf(out) <= MAX_BYTES) return out;
  }
  for (const q of [0.86, 0.78, 0.68, 0.56]) {
    const out = canvas.toDataURL('image/jpeg', q);
    if (bytesOf(out) <= MAX_BYTES) return out;
  }
  throw new Error('Сликата е преголема и по намалувањето.');
}
