import {NativeModules} from 'react-native';
import {Device} from "../models/Device";

const {BluetoothModule} = NativeModules;

export type AdvertisementCallback = (advertisementCallback: string) => void
export type ScanResultCallback = (devices: Device[]) => void
export type StopScanCallback = () => void
export type ConnectedCallback = (device: Device) => void
export type DisconnectedCallback = (address: string) => void
export type ServiceCallback = (status: string) => void
export type MtuChangedCallback = (mtu: string) => void
export type MessageReceivedCallback = (message: string) => void

interface BluetoothInterface {
    //Server
    initServer(pairing: boolean): Promise<boolean>;

    startServer(serviceUuid: string): Promise<boolean>;

    stopServer(): Promise<boolean>;

    disconnectServerDevice(deviceAddress: string): Promise<boolean>;

    pairServerDevice(deviceAddress: string): Promise<boolean>;

    sendServerMessage(message: string): Promise<string>;

    //Client
    initClient(): Promise<boolean>;

    startScan(): Promise<boolean>;

    stopScan(): Promise<boolean>;

    connectDevice(deviceAddress: string): Promise<boolean>;

    disconnectClientDevice(deviceAddress: string): Promise<boolean>;

    pairClientDevice(deviceAddress: string): Promise<boolean>;

    sendClientMessage(message: string): Promise<string>;
}

export default BluetoothModule as BluetoothInterface;
