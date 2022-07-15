import * as React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {BluetoothPeripheral} from "./bluetooth/BluetoothPeripheral";

export const AgentEndpointsScreen = () => {
    return (
        <ScrollView>
            <View style={styles.container}>
                <Text style={{marginBottom: 8}}>Make sure Bluetooth LE Service is running in order to be discoverable to
                    other devices and receive messages</Text>
                <BluetoothPeripheral/>
            </View></ScrollView>);
}

const styles = StyleSheet.create({
    container: {
        margin: 8
    }
})
