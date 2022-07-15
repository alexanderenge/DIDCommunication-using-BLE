import {EmitterSubscription, NativeEventEmitter, NativeModules, PermissionsAndroid} from "react-native"
import store from "../redux/store/Store";
import bluetoothModule, {
    AdvertisementCallback,
    ConnectedCallback,
    DisconnectedCallback,
    MessageReceivedCallback,
    MtuChangedCallback
} from "./BluetoothModule";
import {messageHandler} from "../protocols/Protocols";
import {getServiceUuidFromBleEndpoint, getSettings} from "../utils/AgentUtils";
import {Device} from "../models/Device";

export interface BluetoothServerCallbacks {
    advertisementCallback?: AdvertisementCallback
    connectedCallback?: ConnectedCallback
    disconnectedCallback?: DisconnectedCallback
    mtuChangedCallback?: MtuChangedCallback
    messageReceivedCallback?: MessageReceivedCallback
}

export default class BluetoothServer {
    eventEmitter: NativeEventEmitter | undefined

    isAdvertising: boolean = false
    connectedDevice?: Device

    onAdvertisementEventListener: EmitterSubscription | undefined
    onConnectedGATTClientListener: EmitterSubscription | undefined
    onDisconnectedGATTClientListener: EmitterSubscription | undefined
    onMtuChangedListener: EmitterSubscription | undefined;
    onReceivedMessageListener: EmitterSubscription | undefined

    onAdvertisementEventCallback?: AdvertisementCallback
    onConnectedGATTClientCallback?: ConnectedCallback
    onDisconnectedGATTClientCallback?: DisconnectedCallback
    onMtuChangedCallback?: MtuChangedCallback
    onReceivedMessageCallback?: MessageReceivedCallback

    constructor() {
        this.eventEmitter = new NativeEventEmitter(NativeModules.ToastExample);
        this.init()
        this.setAllListeners()
    }

    init() {
        if (bluetoothModule) {
            bluetoothModule.initServer(getSettings().requirePairing).then(result => console.log('BluetoothServer: init(), result = ' + result))
        }
    }

    startServer = async () => {
        const endpoint: string = store.getState().agent.bluetoothServiceEndpoint;
        let bleServiceUuid = getServiceUuidFromBleEndpoint(endpoint) // Get BLE Service UUID
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Permission Localisation Bluetooth',
                message: 'Requirement for Bluetooth',
                buttonNeutral: 'Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            }
        );
        let result = await bluetoothModule.startServer(bleServiceUuid)
        console.log('BluetoothServer: startServer(), result = ' + result)
    };
    stopServer = async () => {
        let result = await bluetoothModule.stopServer()
        console.log('BluetoothServer: stopServer(), result = ' + result)
    };
    disconnectDevice = async (address: string) => {
        let result = await bluetoothModule.disconnectServerDevice(address)
        console.log('BluetoothServer: disconnectDevice(), result = ' + result)
    };
    pairDevice = async (address: string) => {
        let result = await bluetoothModule.pairServerDevice(address)
        console.log('BluetoothServer: pairDevice(), result = ' + result)
    };
    sendServerMessage = async (message: string): Promise<boolean> => {
        if (this.connectedDevice) {
            return bluetoothModule.sendServerMessage(message).then(() => {
                console.log('BluetoothServer: sendServerMessage(), result = true')
                return true
            }).catch((reason: string) => {
                console.log('BluetoothServer: sendServerMessage(), result = ' + reason)
                return false
            })
        } else {
            console.log('BluetoothServer: sendServerMessage(), result = Not connected to a device')
        }
        return false
    };

    setAdvertisementEventListener = () => {
        this.onAdvertisementEventListener = this.eventEmitter?.addListener('onAdvertisementEvent', (message) => {
            console.log('BluetoothServer: onAdvertisementEventListener(), result = ' + message)
            if (message == 'true') {
                this.isAdvertising = true
            } else if (message == 'false') {
                this.isAdvertising = false
            }
            if (this.onAdvertisementEventCallback) {
                this.onAdvertisementEventCallback(message)
            }
        });
    }
    setOnConnectedGATTClientListener = () => {
        this.onConnectedGATTClientListener = this.eventEmitter?.addListener('onConnectedGATTClient', (device: Device) => {
            console.log('BluetoothServer: onConnectedGATTClientListener(), result = ' + JSON.stringify(device))
            this.connectedDevice = device
            if (this.onConnectedGATTClientCallback) {
                this.onConnectedGATTClientCallback(device)
            }
        });
    }
    setOnDisconnectedGATTClientListener = () => {
        this.onDisconnectedGATTClientListener = this.eventEmitter?.addListener('onDisconnectedGATTClient', (address: string) => {
            console.log('BluetoothServer: onDisconnectedGATTClientListener(), result = ' + address)
            this.connectedDevice = undefined
            if (this.onDisconnectedGATTClientCallback) {
                this.onDisconnectedGATTClientCallback(address)
            }
        });
    }
    setOnMtuChangedListener = () => {
        this.onMtuChangedListener = this.eventEmitter?.addListener('onServerMtuChanged', async (mtu: string) => {
            console.log('BluetoothServer: onMtuChangedListener(), result = ' + mtu)
            if (this.connectedDevice) {
                this.connectedDevice.mtu = mtu
            }
            if (this.onMtuChangedCallback) {
                this.onMtuChangedCallback(mtu)
            }
        });
    }
    setOnReceivedMessageListener = () => {
        this.onReceivedMessageListener = this.eventEmitter?.addListener('onReceivedClientMessage', (message: string) => {
            console.log('BluetoothServer: onReceivedMessageListener(), result = ' + message)
            // Send to message handler
            messageHandler.handleMessage(message).then(() => {
                if (this.onReceivedMessageCallback) {
                    this.onReceivedMessageCallback(message)
                }
            })
        });
    }

    setAllListeners() {
        this.removeAllListeners() // Remove old listeners if exists
        this.setAdvertisementEventListener()
        this.setOnConnectedGATTClientListener() // On connected device listener
        this.setOnDisconnectedGATTClientListener() // On disconnected device listener
        this.setOnMtuChangedListener() // On mtu changed listener
        this.setOnReceivedMessageListener() // On message received listener
    }

    removeAllListeners() {
        this.onAdvertisementEventListener?.remove()
        this.onConnectedGATTClientListener?.remove()
        this.onDisconnectedGATTClientListener?.remove()
        this.onMtuChangedListener?.remove()
        this.onReceivedMessageListener?.remove()
    }

    setCallbacks(callbacks: BluetoothServerCallbacks) {
        this.removeAllCallbacks() // Remove old callbacks if exists
        this.onAdvertisementEventCallback = callbacks.advertisementCallback
        this.onConnectedGATTClientCallback = callbacks.connectedCallback // On connected device callback
        this.onDisconnectedGATTClientCallback = callbacks.disconnectedCallback // On disconnected device callback
        this.onMtuChangedCallback = callbacks.mtuChangedCallback // On mtu changed listener
        this.onReceivedMessageCallback = callbacks.messageReceivedCallback // On message received listener
    }

    removeAllCallbacks() {
        this.onAdvertisementEventCallback = undefined
        this.onConnectedGATTClientCallback = undefined
        this.onDisconnectedGATTClientCallback = undefined
        this.onMtuChangedCallback = undefined
        this.onReceivedMessageCallback = undefined
    }

}
