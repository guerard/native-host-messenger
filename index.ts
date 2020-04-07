import { InboundTransform, OutboundTransform } from './lib/transform-stream';
import { Readable, Writable } from 'stream';

export interface Handler {
    (message: any, sendMessage: (out: any) => void): void;
}

export class NativeHostMessenger {
    private readonly inbound = new InboundTransform();
    private readonly outbound = new OutboundTransform();
    private readonly sendMessage = (message: any): void => {
        this.outbound.write(message);
    };

    constructor(
        private readonly handler: Handler,
        private readonly stdin: Readable = process.stdin,
        private readonly stdout: Writable = process.stdout,
    ) {

        this.outbound.pipe(this.stdout);

        this.stdin.pipe(this.inbound).on('data', (message) => {
            setImmediate(() => this.handler(message, this.sendMessage));
        });
    }
}