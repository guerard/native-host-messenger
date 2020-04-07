import stream from 'stream';
import { readUInt32 } from './native';

/**
 * 
 */
export class InboundTransform extends stream.Transform {
    private buffer: Buffer = Buffer.alloc(0);
    private messageLength: number | null | undefined;

    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: false,
        });
    }

    _transform(chunk: Buffer, encoding: string, done: () => void): void {
        if (encoding !== 'buffer') {
            throw new Error('InboundTransform can only handle raw bytes');
        }

        this.buffer = Buffer.concat([this.buffer, chunk]);

        const consumeBuf = () => {
            if (this.messageLength == null && this.buffer.length >= 4) {
                this.messageLength = readUInt32(this.buffer, 0);
                this.buffer = this.buffer.slice(4);
            }
            if (this.messageLength != null && this.buffer.length >= this.messageLength) {
                const message = this.buffer.slice(0, this.messageLength);
                this.buffer = this.buffer.slice(this.messageLength);
                this.messageLength = null;
                setImmediate(() => this.push(JSON.parse(message.toString())));
                setImmediate(consumeBuf);
                return;
            }
            done();
        };
        
        consumeBuf();
    }
}