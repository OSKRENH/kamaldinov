// Select strictly black or white once per cover, never a complementary hue.
// Canvas is sampled at very low resolution and cached for each image element.
const inkCache = new WeakMap();
const DARK = '#111111';
const LIGHT = '#ffffff';

function readCoverInk(image) {
  if (inkCache.has(image)) return inkCache.get(image);

  let ink = DARK;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, 40, 40);
    const data = ctx.getImageData(0, 0, 40, 40).data;
    const values = [];

    // Sample the visual field, with a little more emphasis on the outer
    // areas that form the enlarged blurred backdrop behind UI labels.
    for (let y = 2; y < 40; y += 3) {
      for (let x = 2; x < 40; x += 3) {
        const i = (y * 40 + x) * 4;
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const linear = (v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
        const luminance = .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
        values.push(luminance);
        if (x < 11 || x > 29) values.push(luminance);
      }
    }
    values.sort((a, b) => a - b);
    const median = values[Math.floor(values.length / 2)];
    // 0.179 is the relative luminance at which black and white offer equal
    // contrast according to the WCAG contrast-ratio equation.
    ink = median < .179 ? LIGHT : DARK;
  } catch {
    // Preserve neutral readable ink for unexpected cross-origin images.
  }
  inkCache.set(image, ink);
  return ink;
}

export function matchGalleryInk(page, slide) {
  const image = slide?.preview;
  page.style.setProperty('--gallery-ink',
    image?.naturalWidth ? readCoverInk(image) : DARK);
}
