import React from 'react';
import {Text, View} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {Button} from "react-native-paper";
import {messageHandler} from "../protocols/Protocols";

export const ScanScreen = ({navigation}: { navigation: any }) => {
    const onSuccess = async (e: { data: string; }) => {
        await messageHandler.handleOOBMessage(e.data).then()
        navigation.goBack()
    };

    return (
        <View>
            <QRCodeScanner
                onRead={onSuccess}
                topContent={
                    <Text>Scan a QR code to read the invitation</Text>
                }
                bottomContent={
                    <Button>Turn flash on</Button>
                }
            />
        </View>
    );
}
