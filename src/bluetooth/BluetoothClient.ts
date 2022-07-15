import {EmitterSubscription, NativeEventEmitter, NativeModules, PermissionsAndroid} from "react-native";
import {Device} from "../models/Device";
import bluetoothModule, {
    ConnectedCallback,
    DisconnectedCallback,
    MessageReceivedCallback,
    MtuChangedCallback,
    ScanResultCallback,
    ServiceCallback,
    StopScanCallback
} from "./BluetoothModule";
import {messageHandler} from "../protocols/Protocols";

export interface BluetoothClientCallbacks {
    scanResultCallback?: ScanResultCallback
    stopScanCallback?: StopScanCallback
    connectedCallback?: ConnectedCallback
    disconnectedCallback?: DisconnectedCallback
    serviceCallback?: ServiceCallback
    mtuChangedCallback?: MtuChangedCallback
    messageReceivedCallback?: MessageReceivedCallback
}

export default class BluetoothClient {
    eventEmitter: NativeEventEmitter | undefined

    isScanning: boolean = false
    devices: Device[] = []
    connectedDevice?: Device

    onScanResultListener: EmitterSubscription | undefined
    onStopScanListener: EmitterSubscription | undefined;
    onConnectedGATTServerListener: EmitterSubscription | undefined;
    onDisconnectedGATTServerListener: EmitterSubscription | undefined;
    onServicesDiscoveredListener: EmitterSubscription | undefined;
    onMtuChangedListener: EmitterSubscription | undefined;
    onReceivedMessageListener: EmitterSubscription | undefined;

    onScanResultCallback?: ScanResultCallback
    onStopScanCallback?: StopScanCallback
    onConnectedGATTServerCallback?: ConnectedCallback
    onDisconnectedGATTServerCallback?: DisconnectedCallback
    onServicesDiscoveredCallback?: ServiceCallback
    onMtuChangedCallback?: MtuChangedCallback
    onReceivedMessageCallback?: MessageReceivedCallback

    constructor() {
        this.eventEmitter = new NativeEventEmitter(NativeModules.ToastExample);
        this.init()
        this.setAllListeners()
    }

    init() {
        if (bluetoothModule) {
            bluetoothModule.initClient().then(result => console.log('BluetoothClient: init(), result = ' + result))
        }
    }

    startScan = async () => {
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
        if (!this.isScanning) {
            let result = await bluetoothModule.startScan()
            if (result) {
                this.isScanning = true
                console.log('BluetoothClient: startScan(), result = Scan is now running')
            }
        } else {
            console.log('BluetoothClient: startScan(), result = Scan is already scanning')
        }
    };
    stopScan = async () => {
        if (this.isScanning) {
            this.isScanning = false
            let result = await bluetoothModule.stopScan()
            console.log('BluetoothClient: stopScan(), result = Stop scanning')
        } else {
            console.log('BluetoothClient: stopScan(), result = Scan is already stopped')
        }
    };
    connectDevice = async (address: string) => {
        let result = await bluetoothModule.connectDevice(address)
    };
    disconnectDevice = async () => {
        if (this.connectedDevice) {
            let result = await bluetoothModule.disconnectClientDevice(this.connectedDevice.address)
            if (result) {
                console.log('BluetoothClient: disconnectDevice(), result = Successfully disconnected from device')
                this.connectedDevice = undefined
            }
        } else {
            console.log('BluetoothClient: disconnectDevice(), result = Already disconnected from device')
        }
    };
    pairDevice = async (address: string) => {
        let result = await bluetoothModule.pairClientDevice(address)
        console.log('BluetoothClient: pairDevice(), result = ' + result)
    };
    sendClientMessage = async (message: string): Promise<boolean> => {
        if (this.connectedDevice) {
            return bluetoothModule.sendClientMessage(message).then(() => {
                console.log('BluetoothClient: sendClientMessage(), result = true')
                return true
            }).catch((reason: string) => {
                console.log('BluetoothClient: sendClientMessage(), result = ' + reason)
                return false
            })
        } else {
            console.log('BluetoothClient: sendClientMessage(), result = Not connected to a device')
        }
        return false
    };

    setOnScanResultListener = () => {
        this.onScanResultListener = this.eventEmitter?.addListener('onScanResult', (devices: Device[]) => {
            console.log('BluetoothClient: onScanResultListener(), result = ' + JSON.stringify(devices))
            this.devices = devices
            if (this.onScanResultCallback) {
                this.onScanResultCallback(devices)
            }
        });
    }
    setOnStopScanListener = () => {
        this.onStopScanListener = this.eventEmitter?.addListener('onStopScan', () => {
            console.log('BluetoothClient: onStopScanListener(), result = true')
            this.isScanning = false
            if (this.onStopScanCallback) {
                this.onStopScanCallback()
            }
        });
    }
    setOnConnectedGATTServerListener = () => {
        this.onConnectedGATTServerListener = this.eventEmitter?.addListener('onConnectedGATTServer', (connectedDevice: Device) => {
            console.log('BluetoothClient: onConnectedGATTServerListener(), result = ' + JSON.stringify(connectedDevice))
            this.connectedDevice = this.devices.find((device) => device.address == connectedDevice.address)
            if (this.onConnectedGATTServerCallback) {
                this.onConnectedGATTServerCallback(connectedDevice)
            }
        });
    }
    setOnDisconnectedGATTServerListener = () => {
        this.onDisconnectedGATTServerListener = this.eventEmitter?.addListener('onDisconnectedGATTServer', (address: string) => {
            console.log('BluetoothClient: onDisconnectedGATTServerListener(), result = ' + address)
            this.connectedDevice = undefined
            if (this.onDisconnectedGATTServerCallback) {
                this.onDisconnectedGATTServerCallback(address)
            }
        });
    }
    setOnServicesDiscoveredListener = () => {
        this.onServicesDiscoveredListener = this.eventEmitter?.addListener('onServicesDiscovered', (status) => {
            console.log('BluetoothClient: onServicesDiscoveredListener(), result = ' + status)
            if (this.onServicesDiscoveredCallback) {
                this.onServicesDiscoveredCallback(status)
            }
        });
    }
    setOnMtuChangedListener = () => {
        this.onMtuChangedListener = this.eventEmitter?.addListener('onClientMtuChanged', async (mtu: string) => {
            console.log('BluetoothClient: onMtuChangedListener(), result = ' + mtu)
            if (this.connectedDevice) {
                this.connectedDevice.mtu = mtu
            }
            if (this.onMtuChangedCallback) {
                this.onMtuChangedCallback(mtu)
            }
        });
    }
    setOnReceivedMessageListener = () => {
        this.onReceivedMessageListener = this.eventEmitter?.addListener('onReceivedServerMessage', async (message: string) => {
            console.log('BluetoothClient: onReceivedMessageListener(), result = ' + message)
            // Send to message handler
            messageHandler.handleMessage(message).then(() => {
                if (this.onReceivedMessageCallback) {
                    this.onReceivedMessageCallback(message)
                }
            })
        });
    }

    findDevice(serviceUuid: string, devices: Device[]): Device | undefined {
        if (this.isScanning) {
            for (let device of devices) {
                if (device.serviceUuid === serviceUuid) {
                    this.stopScan() // Stop scan when found device
                    return device
                }
            }
        }
    }

    setAllListeners() {
        this.removeAllListeners() // Remove old listeners if exists
        this.setOnScanResultListener()
        this.setOnStopScanListener()
        this.setOnConnectedGATTServerListener() // On connected device listener
        this.setOnDisconnectedGATTServerListener() // On disconnected device listener
        this.setOnServicesDiscoveredListener() // On services discovered listener
        this.setOnMtuChangedListener() // On mtu changed listener
        this.setOnReceivedMessageListener() // On message received listener
    }

    removeAllListeners() {
        this.onScanResultListener?.remove()
        this.onStopScanListener?.remove()
        this.onConnectedGATTServerListener?.remove()
        this.onDisconnectedGATTServerListener?.remove()
        this.onServicesDiscoveredListener?.remove()
        this.onMtuChangedListener?.remove()
        this.onReceivedMessageListener?.remove()
    }

    setCallbacks(callbacks: BluetoothClientCallbacks) {
        this.removeAllCallbacks() // Remove old callbacks if exists
        this.onScanResultCallback = callbacks.scanResultCallback
        this.onStopScanCallback = callbacks.stopScanCallback
        this.onConnectedGATTServerCallback = callbacks.connectedCallback // On connected device listener
        this.onDisconnectedGATTServerCallback = callbacks.disconnectedCallback // On disconnected device listener
        this.onServicesDiscoveredCallback = callbacks.serviceCallback // On services discovered listener
        this.onMtuChangedCallback = callbacks.mtuChangedCallback // On mtu changed listener
        this.onReceivedMessageCallback = callbacks.messageReceivedCallback // On message received listener
    }

    removeAllCallbacks() {
        this.onScanResultCallback = undefined
        this.onStopScanCallback = undefined
        this.onConnectedGATTServerCallback = undefined
        this.onDisconnectedGATTServerCallback = undefined
        this.onServicesDiscoveredCallback = undefined
        this.onMtuChangedCallback = undefined
        this.onReceivedMessageCallback = undefined
    }
}
