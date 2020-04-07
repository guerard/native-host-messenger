import { NativeHostMessenger, Handler } from '..';
import stream from 'stream';
import { writeUInt32 } from '../lib/native';

test('inbound messages received by handler', async () => {
    const testMsg = { test: [1] };
    let handler: jest.MockedFunction<Handler> | undefined;
    await new Promise((resolve, reject) => {
        handler = jest.fn((msg, sender) => resolve());
        const stdin = new stream.PassThrough();
        const stdout = new stream.PassThrough();
        new NativeHostMessenger(handler, stdin, stdout);

        stdin.write(convertToBytesMessage(testMsg));
    });
    if (!handler) fail();
    expect(handler.mock.calls.length).toBe(1);
    expect(handler.mock.calls[0][0]).toEqual(testMsg);
});

test('handler can send outbound messages', async () => {
    const testMsg = { test: [1] };
    const testResponse = {
        test: [1],
        out: true,
    };
    const expectedResponseBytes = convertToBytesMessage(testResponse);
    const handler: Handler = (msg, sendMessage) => {
        sendMessage(testResponse);
    };
    const stdin = new stream.PassThrough();
    const stdout = new stream.PassThrough();
    new NativeHostMessenger(handler, stdin, stdout);

    let outBuf = Buffer.alloc(0);
    const stdoutReceived = new Promise(resolve => {
        stdout.on('data', chunk => {
            outBuf = Buffer.concat([outBuf, chunk]);
            if (outBuf.length === expectedResponseBytes.length) resolve();
        });
    });
    stdin.write(convertToBytesMessage(testMsg));
    await stdoutReceived;
    expect(outBuf).toEqual(expectedResponseBytes);
});

function convertToBytesMessage(o: any): Buffer {
    const msgBuf = Buffer.from(JSON.stringify(o));
    const msgLenBuf = Buffer.alloc(4);
    writeUInt32(msgLenBuf, msgBuf.length, 0);
    return Buffer.concat([msgLenBuf, msgBuf]);
}