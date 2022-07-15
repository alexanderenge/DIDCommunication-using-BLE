import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, DataTable, List} from "react-native-paper";
import {BluetoothClientCallbacks} from "../../bluetooth/BluetoothClient";
import {Device} from "../../models/Device";
import {messageHandler} from "../../protocols/Protocols";
import {
    ConnectedCallback,
    DisconnectedCallback,
    ScanResultCallback,
    StopScanCallback
} from "../../bluetooth/BluetoothModule";

export const BluetoothCentralScreen = () => {
    const [isScanning, setIsScanning] = useState(messageHandler.bluetoothClient.isScanning)
    const [devices, setDevices] = useState<Device[]>(messageHandler.bluetoothClient.devices)
    const [connectedDevice, setConnectedDevice] = useState<Device | undefined>(messageHandler.bluetoothClient.connectedDevice)

    class DeviceCallbacks implements BluetoothClientCallbacks {
        scanResultCallback: ScanResultCallback = (devices: Device[]) => {
            setDevices(devices)
        };
        stopScanCallback: StopScanCallback = () => {
            setIsScanning(false)
        };
        connectedCallback: ConnectedCallback = (device: Device) => {
            setConnectedDevice(device)
        };
        disconnectedCallback: DisconnectedCallback = (address: string) => {
            setConnectedDevice(undefined)
        };
    }

    useEffect(() => {
        messageHandler.bluetoothClient?.setCallbacks(new DeviceCallbacks())
        return () => {
            messageHandler.bluetoothClient?.removeAllListeners()
        }
    }, [])

    const DevicesTable = () => <View style={styles.container}>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title>MAC</DataTable.Title>
                <DataTable.Title>Device name</DataTable.Title>
                <DataTable.Title>Service UUID</DataTable.Title>
                <DataTable.Title>Paired</DataTable.Title>
            </DataTable.Header>
            {devices.map((device) => {
                return (
                    <DataTable.Row key={device.address}
                                   onPress={() => messageHandler.bluetoothClient?.connectDevice(device.address)
                                   }>
                        <DataTable.Cell>{device.address}</DataTable.Cell>
                        <DataTable.Cell>{device.name}</DataTable.Cell>
                        <DataTable.Cell>{device.serviceUuid}</DataTable.Cell>
                        <DataTable.Cell>{device.paired ? 'Yes' : 'No'}</DataTable.Cell>
                    </DataTable.Row>
                )
            })}

        </DataTable>
    </View>
    return (<View>
        <List.Section>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                <Button style={styles.buttonStyle} mode={'outlined'} onPress={async () => {
                    setIsScanning(true)
                    messageHandler.bluetoothClient.startScan()
                }}>Start Scan</Button>
                <Button style={styles.buttonStyle} mode={'outlined'} onPress={messageHandler.bluetoothClient?.stopScan}>Stop
                    Scan</Button>
                <Button style={styles.buttonStyle} mode={'outlined'} onPress={() => {
                    messageHandler.bluetoothClient?.disconnectDevice()
                }}>Disconnect</Button>
                <Button style={styles.buttonStyle} mode={'outlined'} onPress={() => {
                    messageHandler.bluetoothClient?.sendClientMessage('Ping')
                }}>Ping</Button>
            </View>
            <List.Subheader>Status</List.Subheader>
            <List.Item
                title={connectedDevice ? connectedDevice.address : 'None'}
                description="Device connected"
                left={props => <List.Icon {...props} icon="bluetooth-connect"/>}/>
            <List.Item
                title={isScanning ? 'Scanning' : 'Not scanning'}
                description="Scanning status"
                left={props => <List.Icon {...props} icon="bluetooth"/>}/>
            <List.Subheader>Discovered devices</List.Subheader>
            <ScrollView>
                <DevicesTable/>
            </ScrollView>
        </List.Section>
    </View>);
}

const styles = StyleSheet.create({
    container: {
        padding: 8
    },
    buttonStyle: {
        margin: 4
    }
});
