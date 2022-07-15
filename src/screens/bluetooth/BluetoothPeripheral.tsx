import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Card, Paragraph, TextInput} from "react-native-paper";
import {BluetoothServerCallbacks} from "../../bluetooth/BluetoothServer";
import {useDispatch} from "react-redux";
import store from "../../redux/store/Store";
import {setBluetoothServiceEndpoint} from "../../redux/reducers/agentSlice";
import {v4 as uuidv4} from "uuid";
import {messageHandler} from "../../protocols/Protocols";
import {Device} from "../../models/Device";
import {AdvertisementCallback, ConnectedCallback, DisconnectedCallback} from "../../bluetooth/BluetoothModule";

export const BluetoothPeripheral = () => {
    const [isBroadcasting, setIsBroadcasting] = useState(messageHandler.bluetoothServer.isAdvertising)
    const [connectedDevice, setConnectedDevice] = useState<Device | undefined>(messageHandler.bluetoothServer.connectedDevice) // Address
    const [bleEndpoint, setBleEndpoint] = useState(store.getState().agent.bluetoothServiceEndpoint) // Address
    const dispatch = useDispatch()

    class DeviceCallbacks implements BluetoothServerCallbacks {
        advertisementCallback: AdvertisementCallback = () => {
            if (messageHandler.bluetoothServer.isAdvertising) {
                setIsBroadcasting(true)
            } else {
                setIsBroadcasting(false)
            }
        }
        connectedCallback: ConnectedCallback = (device: Device) => {
            setConnectedDevice(device)
        }
        disconnectedCallback: DisconnectedCallback = (address: string) => {
            setConnectedDevice(undefined)
        }
    }

    useEffect(() => {
        messageHandler.bluetoothServer?.setCallbacks(new DeviceCallbacks())
        return () => {
            messageHandler.bluetoothServer?.removeAllCallbacks()
        }
    }, [])

    const BluetoothService = () => (
        <Card>
            <Card.Title title="Bluetooth LE Service" titleStyle={{fontSize: 16}}/>
            <Card.Content>
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    editable={false}
                    multiline={true}
                    label="Service endpoint"
                    value={bleEndpoint}
                    onChangeText={id => setBleEndpoint(id)}
                    right={<TextInput.Icon name="refresh" disabled={isBroadcasting} onPress={() => {
                        let endpoint = 'ble/' + uuidv4()
                        dispatch(setBluetoothServiceEndpoint(endpoint))
                        setBleEndpoint(endpoint)
                    }}/>}
                />
                <Paragraph>Status: {isBroadcasting ? 'Broadcasting' : 'Not broadcasting'}</Paragraph>
                <Paragraph>Connected device: {connectedDevice?.address}</Paragraph>
            </Card.Content>
            <Card.Actions>
                {isBroadcasting ? <Button onPress={messageHandler.bluetoothServer?.stopServer}>Stop service</Button> :
                    <Button onPress={messageHandler.bluetoothServer?.startServer}>Start service</Button>}
                {connectedDevice ?
                    <Button onPress={() => {
                        messageHandler.bluetoothServer?.sendServerMessage('Ping')
                    }}>Ping device</Button> : <View/>}
            </Card.Actions>
        </Card>
    );
    return (<View>
        <BluetoothService/>
    </View>);
}

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    inputfield: {
        marginBottom: 8
    }
});
