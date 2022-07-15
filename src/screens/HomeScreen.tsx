import * as React from 'react';
import {useEffect} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {Button, Dialog, FAB, List, Paragraph, Portal} from "react-native-paper";
import NfcManager from "react-native-nfc-manager";
import {messageHandler} from "../protocols/Protocols";
import {showGreenSnackBar, showRedSnackBar} from "../utils/Snackbar";
import {readNdef} from "../utils/NFCUtils";

export const HomeScreen = ({navigation}: { navigation: any }) => {
    const [visible, setVisible] = React.useState(false);
    const showDialog = () => {
        setVisible(true)
        console.log('Waiting for read message from NFC Tag')
        readNdef().then(result => {
            if (result) {
                console.log('Successfully read invitation message from NFC Tag')
                showGreenSnackBar('Successfully read invitation message from NFC Tag')
                setVisible(false)
            } else {
                console.log('Failed to read invitation message from NFC Tag')
                showRedSnackBar('Failed to read invitation message from NFC Tag')
                setVisible(false)
            }
        })
    };

    const hideDialog = () => {
        NfcManager.cancelTechnologyRequest();
        setVisible(false)
    };
    useEffect(() => {
        if (!messageHandler.bluetoothServer.isAdvertising) {
            Alert.alert(
                "Bluetooth Messaging",
                "Bluetooth LE Service is not running, do you want to start it?",
                [
                    {
                        text: "Not now",
                        onPress: () => console.log("Cancel pressed"),
                        style: "cancel"
                    },
                    {
                        text: "Start", onPress: () => {
                            messageHandler.bluetoothServer?.startServer()
                        }
                    }
                ]
            );
        }
    })
    return (<><View>
        <List.Item
            title="Access control module"
            onPress={() => {
                navigation.navigate('ACMStart')
            }}
            right={props => <List.Icon {...props} icon="arrow-right"/>}/>
        <List.Item
            title="Testing"
            onPress={() => {
                navigation.navigate('Tests')
            }}
            right={props => <List.Icon {...props} icon="arrow-right"/>}/>
        <View>
            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Scan NFC Tag</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Touch the NFC tag to the back of
                            the phone to read the message.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>Exit</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    </View><FAB
        style={styles.fabQr}
        icon="qrcode"
        label="Scan QR"
        onPress={() => navigation.navigate('Scan')}/><FAB
        style={styles.fabNfc}
        icon="nfc"
        label="Scan Tag"
        onPress={showDialog}/></>);
}

const styles = StyleSheet.create({
    fabQr: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    fabNfc: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 64,
    }
})
