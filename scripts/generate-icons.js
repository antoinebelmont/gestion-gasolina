// Script to generate placeholder icons for the application
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure resources directory exists
const resourcesDir = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

// Create a simple 256x256 PNG with orange background
function createPNG(width, height, r, g, b) {
  // Create raw pixel data (RGB)
  const rawData = Buffer.alloc(height * (1 + width * 3)); // +1 for filter byte per row

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    rawData[rowStart] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      rawData[pixelStart] = r; // Red
      rawData[pixelStart + 1] = g; // Green
      rawData[pixelStart + 2] = b; // Blue
    }
  }

  // Compress the data
  const compressed = zlib.deflateSync(rawData);

  // Create PNG chunks
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 2; // Color type: RGB
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

// Generate icons
console.log('Generating icons...');

// Orange color (matching the app theme)
const r = 255,
  g = 152,
  b = 0; // Orange

// Generate PNG
const png = createPNG(256, 256, r, g, b);
fs.writeFileSync(path.join(resourcesDir, 'icon.png'), png);
console.log('Created resources/icon.png (256x256)');

// For ICO, we'll create a simple one
// ICO format: header + directory entry + PNG data
function createICO(pngData, width, height) {
  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Number of images

  // Directory entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry[0] = width > 255 ? 0 : width; // Width (0 = 256)
  entry[1] = height > 255 ? 0 : height; // Height (0 = 256)
  entry[2] = 0; // Color palette
  entry[3] = 0; // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngData.length, 8); // Size of image data
  entry.writeUInt32LE(22, 12); // Offset to image data

  return Buffer.concat([header, entry, pngData]);
}

// Generate ICO from PNG
const ico = createICO(png, 256, 256);
fs.writeFileSync(path.join(resourcesDir, 'icon.ico'), ico);
console.log('Created resources/icon.ico');

// For macOS ICNS, we need a more complex format
// For now, just copy the PNG as a placeholder
// electron-builder will handle conversion if needed
fs.writeFileSync(path.join(resourcesDir, 'icon.icns'), png);
console.log('Created resources/icon.icns (placeholder PNG)');

console.log('\nIcon generation complete!');
console.log('Note: For production, replace with properly designed icons.');
