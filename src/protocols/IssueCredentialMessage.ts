import {ProtocolHandler} from "./MessageHandler";
import {v4 as uuidv4} from "uuid";
import MessageDetails from "../models/MessageDetails";
import CredentialDetails from "../models/CredentialDetails";
import {VerifiableCredential} from "@veramo/core";
import {addCredential} from "../redux/reducers/credentialsSlice";
import store from "../redux/store/Store";
import {showGreenSnackBar} from "../utils/Snackbar";
import {messageHandler} from "./Protocols";
import {agent} from "../veramo/setup";
import {DIDCommMessagePacking} from "@veramo/did-comm";

enum CredentialMessageTypes {
    W3C_VC = 'w3c.vc',
    W3C_VP = 'w3c.vp',
    JWT = 'jwt'
}

export class IssueCredentialMessage implements ProtocolHandler {
    private readonly onReceiveIssueCredentialMessageListener: (message: MessageDetails, verifiableCredentials?: VerifiableCredential[]) => boolean;

    constructor(callback: IssueCredentialMessageCallback) {
        this.onReceiveIssueCredentialMessageListener = callback.onReceiveIssueCredentialMessage
    }

    handleMessage(message: MessageDetails): boolean {
        if (message.type == CredentialMessageTypes.W3C_VC || message.type == CredentialMessageTypes.JWT) {
            this.handleCredentialMessage(message)
            return true
        }
        return false;
    }

    async sendIssueCredentialMessage(vc: VerifiableCredential, options: { from: string, to: string, packingMode: DIDCommMessagePacking }): Promise<MessageDetails> {
        let message: MessageDetails = {
            id: uuidv4(),
            type: CredentialMessageTypes.W3C_VC,
            from: options.from,
            to: options.to,
            created_time: Math.floor(Date.now() / 1000).toString(),
            body: vc
        }
        await messageHandler.sendMessage(message, [message.to], true, options.packingMode)
        return message
    }

    private async handleCredentialMessage(message: MessageDetails) {
        let credentialMessage = await agent.handleMessage({
            raw: JSON.stringify(message),
            save: false
        })
        let verifiableCredentials: VerifiableCredential[] | undefined = credentialMessage.credentials
        verifiableCredentials?.forEach((vc => {
            if (vc.id) {
                // Automatically save to your credentials
                let credentialDetails: CredentialDetails = {
                    id: vc.id,
                    verifiableCredential: vc,
                    issued: false
                }
                store.dispatch(addCredential(credentialDetails))
                showGreenSnackBar('Credential is received and automatically saved to your wallet')
                console.log('Saved credential: ' + JSON.stringify(vc))
            }
        }))
        this.onReceiveIssueCredentialMessageListener(message, verifiableCredentials)
    }
}

export class IssueCredentialMessageCallback {
    onReceiveIssueCredentialMessage(message: MessageDetails, verifiableCredentials?: VerifiableCredential[]): boolean {
        console.log('onReceiveIssueCredentialMessage: ' + verifiableCredentials)
        return true
    }
}

