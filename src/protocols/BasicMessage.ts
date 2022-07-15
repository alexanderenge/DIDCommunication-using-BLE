import {ProtocolHandler} from "./MessageHandler";
import {v4 as uuidv4} from "uuid";
import MessageDetails from "../models/MessageDetails";
import {messageHandler} from "./Protocols";
import {DIDCommMessagePacking} from "@veramo/did-comm";

enum BasicMessageTypes {
    MESSAGE = 'https://didcomm.org/basicmessage/2.0/message'
}

export class BasicMessage implements ProtocolHandler {
    private readonly onReceiveBasicMessageListener: (message: MessageDetails) => boolean;

    constructor(callback: BasicMessageCallback) {
        this.onReceiveBasicMessageListener = callback.onReceiveBasicMessage
    }

    handleMessage(message: MessageDetails): boolean {
        if (message.type == BasicMessageTypes.MESSAGE) {
            this.handleBasicMessage(message)
            return true
        }
        return false;
    }

    async sendBasicMessage(content: string, options: { from: string, to: string, packingMode: DIDCommMessagePacking }): Promise<MessageDetails> {
        let messageContent = {'content': content}
        let message: MessageDetails = {
            id: uuidv4(),
            type: BasicMessageTypes.MESSAGE,
            from: options.from,
            to: options.to,
            created_time: Math.floor(Date.now() / 1000).toString(),
            body: messageContent
        }
        await messageHandler.sendMessage(message, [message.to], true, options.packingMode)
        return message
    }

    private handleBasicMessage(message: MessageDetails) {
        this.onReceiveBasicMessageListener(message)
    }
}

export class BasicMessageCallback {
    onReceiveBasicMessage(message: MessageDetails): boolean {
        console.log('onReceiveBasicMessage: ' + message.id)
        return true
    }
}

