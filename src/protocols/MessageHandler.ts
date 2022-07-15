import {IService} from "@veramo/core";
import store from "../redux/store/Store";
import Chat from "../models/Chat";
import IdentifierDetails from "../models/IdentifierDetails";
import {selectIdentifierDetailById} from "../redux/reducers/identifierDetailsSlice";
import MessageDetails from "../models/MessageDetails";
import BluetoothServer from "../bluetooth/BluetoothServer";
import BluetoothClient, {BluetoothClientCallbacks} from "../bluetooth/BluetoothClient";
import {showRedSnackBar, showSnackBar} from "../utils/Snackbar";
import {addTheirMessageToChat, addYourMessageToChat, getChat} from "../utils/ChatUtils";
import {Device} from "../models/Device";
import {getServiceUuidFromBleEndpoint, isTesting} from "../utils/AgentUtils";
import {Linking} from "react-native";
import {base64urlDecodeMessage, getBase64urlEncodedMessageFromOobUrl} from "../utils/ConnectionUtils";
import {messageHandler} from "./Protocols";
import {agent} from "../veramo/setup";
import performance from "react-native-performance";
import {ScanResultCallback, ServiceCallback, StopScanCallback} from "../bluetooth/BluetoothModule";
import {DIDCommMessagePacking, IPackedDIDCommMessage, IUnpackedDIDCommMessage} from "@veramo/did-comm";

type MessageCallback = {
    success: () => void,
    error: (e?: any) => void
}

export interface ProtocolHandler {
    handleMessage(message: MessageDetails): boolean
}

export const createMessageHandler = (protocols: ProtocolHandler[]) => new MessageHandler(protocols)

export class MessageHandler {

    protocols: ProtocolHandler[]
    bluetoothServer: BluetoothServer
    bluetoothClient: BluetoothClient

    isSendingMessage = false

    testId: number = 0

    constructor(protocols: ProtocolHandler[]) {
        this.protocols = protocols;
        this.bluetoothServer = new BluetoothServer()
        this.bluetoothClient = new BluetoothClient()
        // Handle deep links
        this.getInitialURL().then()
        Linking.addEventListener('url', (event) => {
            this.handleOOBMessage(event.url).then()
        })
    }

    private protocolMessageHandler(message: MessageDetails): boolean {
        for (let protocol of this.protocols) {
            let result = protocol.handleMessage(message)
            if (result) {
                return true
            }
        }
        return false
    }

    private async getInitialURL() {
        let url = await Linking.getInitialURL()
        if (url) {
            this.handleOOBMessage(url).then()
        }
    }

    async handleOOBMessage(oobUrl: string): Promise<boolean> {
        let base64urlEncodedMessage = getBase64urlEncodedMessageFromOobUrl(oobUrl)
        if (base64urlEncodedMessage) {
            let invitationMessage = base64urlDecodeMessage(base64urlEncodedMessage)
            return this.handleMessage(invitationMessage)
        } else {
            showRedSnackBar('getBase64urlEncodedMessageFromOobUrl returned null')
        }
        return false
    }

    public async handleMessage(inputMessage: string, saveToChat = true): Promise<boolean> {
        this.testId++
        performance.mark('handleMessageMark:' + this.testId);

        // 1. Unpack message
        let unpackedDIDCommMessage: IUnpackedDIDCommMessage | null = await agent.unpackDIDCommMessage({
            message: inputMessage
        })
            .catch((error: any) => {
                console.log('Unsupported message type: ' + error)
                return null
            })
        if (unpackedDIDCommMessage) {
            let message: MessageDetails = unpackedDIDCommMessage.message
            message.packingMode = unpackedDIDCommMessage.metaData.packing

            // 2. Save message to chat
            if (saveToChat && !isTesting()) {
                if (message.to && message.from) {
                    let chat: Chat = getChat(message.to, message.from)
                    addTheirMessageToChat(chat, message)
                }
            }

            performance.measure('handleMessageMeasure', {
                start: 'handleMessageMark:' + this.testId,
                detail: {
                    messageId: message.id,
                    messageType: message.type,
                    messageContentLength: message.body?.content?.length,
                    messagePackingMode: message.packingMode,
                    messagePackedBytes: Buffer.byteLength(inputMessage, 'utf-8')
                }
            });

            // 3. Dispatch message to a protocol handler for this type
            try {
                let result = this.protocolMessageHandler(message)
                if (result) {
                    return true
                } else {
                    showSnackBar('No protocol handler was found')
                }
            } catch (e: any) {
                console.log(e)
                showRedSnackBar('Error handling message')
            }
        } else {
            showSnackBar('Unsupported message: ' + inputMessage)
        }
        return false
    }

    public async sendMessage(message: MessageDetails, serviceEndpoints: Array<any>, saveToChat = true, packingMode?: DIDCommMessagePacking, _messageCallback?: Partial<MessageCallback>): Promise<IPackedDIDCommMessage | undefined> {
        return new Promise(async (resolve, reject) => {
            this.testId++
            if (!this.isSendingMessage) {
                this.isSendingMessage = true
                let messageCallback: MessageCallback = {
                    success: () => {
                        this.isSendingMessage = false
                        _messageCallback?.success?.()
                        performance.measure('onSentMessageMeasure', {
                            start: 'sendMessageMark:' + this.testId,
                            detail: {
                                messageId: message.id,
                                messageType: message.type,
                                messageContentLength: message.body?.content?.length,
                                messagePackingMode: message.packingMode,
                                messagePackedBytes: Buffer.byteLength(packedDIDCommMessage.message, 'utf-8')
                            }
                        });
                        resolve(packedDIDCommMessage)
                    },
                    error: (e: any) => {
                        this.isSendingMessage = false
                        _messageCallback?.error?.(e)
                        showRedSnackBar('Failed to send message')
                        reject(e)
                    }
                }
                performance.mark('sendMessageMark:' + this.testId);

                // 1. Pack message
                let packing: DIDCommMessagePacking = packingMode ? (packingMode) : (message.from && message.to) ? 'authcrypt' : (message.to) ? 'anoncrypt' : 'none'
                let packedDIDCommMessage: IPackedDIDCommMessage = await agent.packDIDCommMessage({
                    message: message,
                    packing: packing
                })
                message.packingMode = packing

                // 2. Save message to chat
                if (saveToChat && !isTesting()) {
                    if (message.from && message.to) {
                        let chat: Chat = getChat(message.from, message.to)
                        addYourMessageToChat(chat, message)
                    }
                }

                // 3. Send it to other agent service endpoint
                if (serviceEndpoints[0]) {
                    this.sendMessageToServiceEndpoint(serviceEndpoints[0], message, packedDIDCommMessage, messageCallback)
                } else {
                    messageCallback?.success()
                }
            } else {
                throw new Error('Busy while sending other message')
            }
        })
    }

    private sendMessageToServiceEndpoint(serviceEndpoint: string | IService, message: MessageDetails, packedDIDCommMessage: IPackedDIDCommMessage, messageCallback?: MessageCallback) {
        if (typeof serviceEndpoint === 'object' && serviceEndpoint !== null) { // Service endpoint is an object
            if (serviceEndpoint.serviceEndpoint.startsWith('ble/')) { // Handle BLE endpoints here
                this.sendMessageToBleEndpoint(message, packedDIDCommMessage, serviceEndpoint.serviceEndpoint, messageCallback)
            } else { // Handle other endpoints here
                this.sendMessageToHttpEndpoint(message, packedDIDCommMessage, serviceEndpoint.serviceEndpoint, messageCallback)
            }
        } else if (typeof serviceEndpoint === 'string') { // Service endpoint is a string
            let identifier: IdentifierDetails | undefined = selectIdentifierDetailById(store.getState(), serviceEndpoint)
            if (serviceEndpoint.startsWith('did:key')) {
                if (identifier) {
                    identifier.services.forEach((endpoint: IService) => {
                        this.sendMessageToServiceEndpoint(endpoint, message, packedDIDCommMessage, messageCallback)
                    })
                }
            } else if (serviceEndpoint.startsWith('did:web')) {
                agent.sendDIDCommMessage({
                    messageId: message.id,
                    packedMessage: packedDIDCommMessage,
                    recipientDidUrl: serviceEndpoint
                }).then(() => {
                    messageCallback?.success()
                }).catch((error: any) => {
                    messageCallback?.error(() => {
                        console.log('Error: ' + error)
                    })
                })
            }
        } else {
            console.log('Could not send to serviceEndpoint: ' + serviceEndpoint)
        }
    }

    private sendMessageToBleEndpoint(message: MessageDetails, packedDIDCommMessage: IPackedDIDCommMessage, endpoint: string, messageCallback?: MessageCallback) {
        let bleServiceUuid = getServiceUuidFromBleEndpoint(endpoint) // Get BLE Service UUID
        this.bluetoothClient?.setCallbacks(new MessageDeviceCallbacks(message, packedDIDCommMessage, bleServiceUuid, messageCallback)) // Try to send message here

        // Check if already connected with a device with this service endpoint
        if (this.bluetoothClient.connectedDevice?.serviceUuid === bleServiceUuid) {
            performance.measure('startSendingMeasure', {
                start: 'sendMessageMark:' + this.testId,
                detail: {
                    messageId: message.id,
                    messageType: message.type,
                    messageContentLength: message.body?.content?.length,
                    messagePackingMode: message.packingMode,
                    messagePackedBytes: Buffer.byteLength(packedDIDCommMessage.message, 'utf-8')
                }
            });
            this.bluetoothClient.sendClientMessage(packedDIDCommMessage.message).then(result => {
                if (result) {
                    messageCallback?.success()
                } else if (!result) {
                    messageCallback?.error()
                }
            })
        } else { // If not connected, scan for device and connect to it if discovered
            performance.mark('startScanMark:' + this.testId);
            this.bluetoothClient?.startScan()
        }
    }

    private sendMessageToHttpEndpoint(message: MessageDetails, packedDIDCommMessage: IPackedDIDCommMessage, endpoint: string, messageCallback?: MessageCallback) {
        fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: packedDIDCommMessage.message
        }).then((response) => {
            if (response.status != 200) {
                messageCallback?.error()
            } else {
                messageCallback?.success()
            }
        }).catch(reason => messageCallback?.error(reason))
    }
}

class MessageDeviceCallbacks implements BluetoothClientCallbacks {
    foundDevice?: Device
    message: MessageDetails;
    packedDIDCommMessage: IPackedDIDCommMessage
    bleServiceUuid: string

    messageCallback?: MessageCallback

    constructor(message: MessageDetails, packedDIDCommMessage: IPackedDIDCommMessage, bleServiceUuid: string, messageCallback?: MessageCallback) {
        this.message = message
        this.packedDIDCommMessage = packedDIDCommMessage
        this.bleServiceUuid = bleServiceUuid
        this.messageCallback = messageCallback
    }

    scanResultCallback: ScanResultCallback = (devices: Device[]) => {
        this.foundDevice = messageHandler.bluetoothClient.findDevice(this.bleServiceUuid, devices)
        if (this.foundDevice) {
            performance.measure('foundDeviceMeasure', {
                start: 'startScanMark:' + messageHandler.testId,
                detail: {
                    messageId: this.message.id,
                    messageType: this.message.type,
                    messageContentLength: this.message.body?.content?.length,
                    messagePackingMode: this.message.packingMode,
                    messagePackedBytes: Buffer.byteLength(this.packedDIDCommMessage.message, 'utf-8')
                }
            });
            messageHandler.bluetoothClient?.connectDevice(this.foundDevice.address)
        }
    };
    stopScanCallback: StopScanCallback = () => {
        if (!this.foundDevice) {
            this.messageCallback?.error()
        }
    };
    serviceCallback: ServiceCallback = async (status: string) => {
        if (status === 'true') {
            performance.measure('discoveredServiceMeasure', {
                start: 'startScanMark:' + messageHandler.testId,
                detail: {
                    messageId: this.message.id,
                    messageType: this.message.type,
                    messageContentLength: this.message.body?.content?.length,
                    messagePackingMode: this.message.packingMode,
                    messagePackedBytes: Buffer.byteLength(this.packedDIDCommMessage.message, 'utf-8')
                }
            });
            let result = await messageHandler.bluetoothClient?.sendClientMessage(this.packedDIDCommMessage.message)
            if (result) {
                this.messageCallback?.success()
            } else {
                this.messageCallback?.error()
            }
        }
    };
}
