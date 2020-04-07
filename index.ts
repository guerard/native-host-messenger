import { InboundTransform } from './lib/transform-stream';

export interface Handler {
    (message: any, sendMessage: (out: any) => void): void;
}

export class NativeHostMessenger {
    constructor(private readonly handler: Handler) {
        // TODO replace stub
        const sendMessage: (out: any) => void = () => { };

        process.stdin.pipe(new InboundTransform()).on('data', (message) => {
            setImmediate(() => this.handler(message, sendMessage));
        });
    }
}