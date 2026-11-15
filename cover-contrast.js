const RASTER_SIZE = 64;
const cache = new WeakMap();

function rasterFor(image) {
  if (cache.has(image)) return cache.get(image);
  let raster = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = RASTER_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, RASTER_SIZE, RASTER_SIZE);
    raster = context.getImageData(0, 0, RASTER_SIZE, RASTER_SIZE).data;
  } catch {
    // Some externally hosted images don't allow pixel inspection.
  }
  cache.set(image, raster);
  return raster;
}

function imageBounds(box, ratio, fit, xAlign, yAlign) {
  const width = fit === 'cover' ? Math.max(box.width, box.height * ratio) : Math.min(box.width, box.height * ratio);
  const height = width / ratio;
  return {
    left: box.left + (box.width - width) * xAlign,
    top: box.top + (box.height - height) * yAlign,
    width,
    height,
  };
}

const linear = (channel) => channel <= 10.31475 ? channel / 3294.6 : ((channel / 255 + .055) / 1.055) ** 2.4;

function luminance(raster, bounds, x, y, brightness = 1) {
  const sx = Math.max(0, Math.min(RASTER_SIZE - 1, Math.floor((x - bounds.left) * RASTER_SIZE / bounds.width)));
  const sy = Math.max(0, Math.min(RASTER_SIZE - 1, Math.floor((y - bounds.top) * RASTER_SIZE / bounds.height)));
  const i = (sy * RASTER_SIZE + sx) * 4;
  return .2126 * linear(raster[i] * brightness) + .7152 * linear(raster[i + 1] * brightness) + .0722 * linear(raster[i + 2] * brightness);
}

function setInk(node, light) {
  node.style.setProperty('--cover-ink', light ? '#fff' : '#0d0d0d');
  node.style.setProperty('--cover-text-shadow', light ? 'rgb(0 0 0 / .68)' : 'rgb(255 255 255 / .7)');
}

export function updateCoverContrast(slide, targets) {
  const image = slide?.querySelector('img');
  const raster = image?.naturalWidth ? rasterFor(image) : null;
  if (!raster) {
    for (const node of targets) setInk(node, Boolean(image));
    return;
  }

  const ratio = image.naturalWidth / image.naturalHeight;
  const imageBox = image.getBoundingClientRect();
  const slideBox = slide.getBoundingClientRect();
  const wide = slide.dataset.orientation === 'wide';
  const front = imageBounds(imageBox, ratio, wide ? 'cover' : 'contain', wide ? 0 : .5, 1);
  const backdrop = imageBounds({
    left: slideBox.left - 24, top: slideBox.top - 24,
    width: slideBox.width + 48, height: slideBox.height + 48,
  }, ratio, 'cover', .5, .5);

  for (const node of targets) {
    const box = node.getBoundingClientRect();
    const tones = [];
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 9; column++) {
        const x = box.left + box.width * (column + .5) / 9;
        const y = box.top + box.height * (row + .5) / 5;
        const onImage = x >= Math.max(front.left, imageBox.left) && x <= Math.min(front.left + front.width, imageBox.right)
          && y >= Math.max(front.top, imageBox.top) && y <= Math.min(front.top + front.height, imageBox.bottom);
        tones.push(luminance(raster, onImage ? front : backdrop, x, y, onImage ? 1 : .92));
      }
    }
    tones.sort((a, b) => a - b);
    setInk(node, tones[Math.floor(tones.length / 2)] < .179);
  }
}
