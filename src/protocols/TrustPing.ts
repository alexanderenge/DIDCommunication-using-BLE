import {ProtocolHandler} from "./MessageHandler";
import {v4 as uuidv4} from "uuid";
import MessageDetails from "../models/MessageDetails";
import {showGreenSnackBar} from "../utils/Snackbar";
import {messageHandler} from "./Protocols";
import performance from "react-native-performance";

enum TrustPingMessageTypes {
    PING = 'https://didcomm.org/trust-ping/2.0/ping',
    PING_RESPONSE = 'https://didcomm.org/trust-ping/2.0/ping-response',
}

export class TrustPing implements ProtocolHandler {
    private readonly onReceivePingListener: (pingId: string) => boolean;
    private readonly onReceivePingResponseListener: (pingId: string, pingResponseCallback?: () => void) => boolean;
    private pingResponseCallbacks: { [key: string]: (() => void) | undefined } = {}

    constructor(callback: TrustPingCallback) {
        this.onReceivePingListener = callback.onReceivePing
        this.onReceivePingResponseListener = callback.onReceivePingResponse
    }

    handleMessage(message: MessageDetails): boolean {
        if (message.type == TrustPingMessageTypes.PING) {
            this.handlePing(message)
            return true
        }
        if (message.type == TrustPingMessageTypes.PING_RESPONSE) {
            this.handlePingResponse(message)
            return true
        }
        return false;
    }

    testId: number = 0

    async sendPing(from: string, to: string, onPingResponse?: () => void): Promise<MessageDetails> {
        this.testId++
        performance.mark('sendPingMark:' + this.testId);
        let messageContent = {'response_requested': true}
        let message: MessageDetails = {
            id: uuidv4(),
            type: TrustPingMessageTypes.PING,
            from: from,
            to: to,
            created_time: Math.floor(Date.now() / 1000).toString(),
            body: messageContent
        }
        this.pingResponseCallbacks[message.id] = onPingResponse
        await messageHandler.sendMessage(message, [message.to], true, undefined, {
            success: () => {
                performance.measure('onSentPingMeasure', {start: 'sendPingMark:' + this.testId});
            }
        })
        return message
    }

    async sendPingResponse(pingId: string, from: string, to: string): Promise<MessageDetails> {
        let messageContent = {}
        let message: MessageDetails = {
            id: uuidv4(),
            thid: pingId,
            type: TrustPingMessageTypes.PING_RESPONSE,
            from: from,
            to: to,
            created_time: Math.floor(Date.now() / 1000).toString(),
            body: messageContent
        }
        await messageHandler.sendMessage(message, [message.to])
        return message
    }

    private handlePing(message: MessageDetails) {
        if (message.to && message.from) {
            this.onReceivePingListener(message.id)
            this.sendPingResponse(message.id, message.to, message.from)
        } else {
            throw new TypeError()
        }
    }

    private handlePingResponse(message: MessageDetails) {
        performance.measure('handlePingResponseMeasure', {start: 'sendPingMark:' + this.testId});
        if (message.thid) {
            let pingResponseCallback = this.pingResponseCallbacks[message.thid]
            this.onReceivePingResponseListener(message.thid, pingResponseCallback)
        } else {
            throw new TypeError()
        }
    }
}

export class TrustPingCallback {
    onReceivePing(pingId: string): boolean {
        console.log('onReceivePing: ' + pingId)
        showGreenSnackBar('Ping received: ' + pingId)
        return true
    }

    onReceivePingResponse(pingId: string, pingResponseCallback?: () => void): boolean {
        console.log('onReceivePingResponse: ' + pingId)
        showGreenSnackBar('Ping response received: ' + pingId)
        if (pingResponseCallback) {
            pingResponseCallback()
        }
        return true
    }
}

