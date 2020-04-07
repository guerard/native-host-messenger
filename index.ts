import { InboundTransform, OutboundTransform } from './lib/transform-stream';

export interface Handler {
    (message: any, sendMessage: (out: any) => void): void;
}

export class NativeHostMessenger {
    private readonly inbound = new InboundTransform();
    private readonly outbound = new OutboundTransform();
    private readonly sendMessage = (message: any): void => {
        this.outbound.write(message);
    };

    constructor(private readonly handler: Handler) {
        this.outbound.pipe(process.stdout);

        process.stdin.pipe(this.inbound).on('data', (message) => {
            setImmediate(() => this.handler(message, this.sendMessage));
        });
    }
}