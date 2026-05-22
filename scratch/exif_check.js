import fs from 'fs';

function getExifOrientation(filePath) {
    const buffer = fs.readFileSync(filePath);
    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
            return -1; // Not a valid marker
        }
        const marker = buffer[offset + 1];
        if (marker === 0xe1) {
            // APP1 marker
            const length = buffer.readUInt16BE(offset + 2);
            const exifHeader = buffer.toString('utf-8', offset + 4, offset + 10);
            if (exifHeader === 'Exif\0\0') {
                const tiffOffset = offset + 10;
                // TIFF Header
                const byteOrder = buffer.toString('utf-8', tiffOffset, tiffOffset + 2);
                const isLittleEndian = byteOrder === 'II';
                const firstIFDOffset = isLittleEndian
                    ? buffer.readUInt32LE(tiffOffset + 4)
                    : buffer.readUInt32BE(tiffOffset + 4);
                
                let ifdOffset = tiffOffset + firstIFDOffset;
                const numEntries = isLittleEndian
                    ? buffer.readUInt16LE(ifdOffset)
                    : buffer.readUInt16BE(ifdOffset);
                
                ifdOffset += 2;
                for (let i = 0; i < numEntries; i++) {
                    const tag = isLittleEndian
                        ? buffer.readUInt16LE(ifdOffset)
                        : buffer.readUInt16BE(ifdOffset);
                    if (tag === 0x0112) {
                        // Orientation Tag
                        const type = isLittleEndian
                            ? buffer.readUInt16LE(ifdOffset + 2)
                            : buffer.readUInt16BE(ifdOffset + 2);
                        const count = isLittleEndian
                            ? buffer.readUInt32LE(ifdOffset + 4)
                            : buffer.readUInt32BE(ifdOffset + 4);
                        const value = isLittleEndian
                            ? buffer.readUInt16LE(ifdOffset + 8)
                            : buffer.readUInt16BE(ifdOffset + 8);
                        return value;
                    }
                    ifdOffset += 12;
                }
            }
            offset += 2 + length;
        } else if (marker === 0xd9 || marker === 0xda) {
            break;
        } else {
            const length = buffer.readUInt16BE(offset + 2);
            offset += 2 + length;
        }
    }
    return 0; // Not found
}

try {
    const orientation = getExifOrientation('public/founder.jpg');
    console.log('EXIF Orientation Tag:', orientation);
} catch (e) {
    console.error('Error parsing EXIF:', e);
}
