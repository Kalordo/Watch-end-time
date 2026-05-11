const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUTPUT_DIR = path.join(__dirname, "..", "icons");
const SIZES = [16, 48, 128];

function crc32(buffer) {
  let crc = -1;

  for (const byte of buffer) {
    crc ^= byte;

    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filePath, width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const scanlines = [];

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;

    for (let x = 0; x < width; x += 1) {
      const [red, green, blue, alpha] = pixels(x, y);
      const offset = 1 + x * 4;
      row[offset] = red;
      row[offset + 1] = green;
      row[offset + 2] = blue;
      row[offset + 3] = alpha;
    }

    scanlines.push(row);
  }

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(scanlines))),
    chunk("IEND", Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

function isInsideRoundedRect(x, y, size, radius) {
  const innerMin = radius;
  const innerMax = size - radius - 1;

  if ((x >= innerMin && x <= innerMax) || (y >= innerMin && y <= innerMax)) {
    return true;
  }

  const cx = x < innerMin ? innerMin : innerMax;
  const cy = y < innerMin ? innerMin : innerMax;
  const dx = x - cx;
  const dy = y - cy;

  return dx * dx + dy * dy <= radius * radius;
}

function isInsidePlayTriangle(x, y, size) {
  const left = size * 0.32;
  const top = size * 0.27;
  const bottom = size * 0.73;
  const right = size * 0.7;

  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }

  const progress = (x - left) / (right - left);
  const halfHeight = ((bottom - top) / 2) * (1 - progress);
  const centerY = size / 2;

  return Math.abs(y - centerY) <= halfHeight;
}

function isOnClockArc(x, y, size) {
  const cx = size * 0.67;
  const cy = size * 0.43;
  const radius = size * 0.24;
  const stroke = Math.max(1.4, size * 0.055);
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  return (
    Math.abs(distance - radius) <= stroke &&
    angle > -2.4 &&
    angle < 2.1 &&
    !(angle > -0.2 && angle < 0.55)
  );
}

function iconPixel(size) {
  return (x, y) => {
    const radius = size * 0.22;

    if (!isInsideRoundedRect(x, y, size, radius)) {
      return [0, 0, 0, 0];
    }

    if (isOnClockArc(x, y, size)) {
      return [255, 255, 255, 255];
    }

    if (isInsidePlayTriangle(x, y, size)) {
      return [255, 0, 51, 255];
    }

    return [15, 15, 15, 255];
  };
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const size of SIZES) {
  writePng(path.join(OUTPUT_DIR, `icon${size}.png`), size, size, iconPixel(size));
}
