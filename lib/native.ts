import os from 'os';

const IS_BE = os.endianness() === 'BE';

export function readUInt32(buf: Buffer, offset: number): number {
    return IS_BE ? buf.readUInt32BE(offset) : buf.readUInt32LE(offset);
}

export function writeUInt32(buf: Buffer, value: number, offset: number): number {
    return IS_BE ? buf.writeUInt32BE(value, offset) : buf.writeUInt32LE(value, offset);
}