import stream from 'stream';
import { readUInt32, writeUInt32 } from './native';

/**
 * Converts byte messages coming from WebExtensions and converts them to in-memory
 * JS objects.
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
                this.push(JSON.parse(message.toString()));
                setImmediate(consumeBuf);
                return;
            }
            done();
        };

        consumeBuf();
    }
}

export class OutboundTransform extends stream.Transform {
    constructor() {
        super({
            readableObjectMode: false,
            writableObjectMode: true,
        });
    }

    _transform(chunk: any, encoding: string, done: () => void): void {
        const messageBuf = Buffer.from(JSON.stringify(chunk));
        const messageLenBuf = Buffer.alloc(4);
        writeUInt32(messageLenBuf, messageBuf.length, 0);
        this.push(messageLenBuf);
        this.push(messageBuf);
        done();
    }
}