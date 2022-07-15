import * as React from 'react';
import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Dialog, List, Modal, Paragraph, Portal, Text} from 'react-native-paper';
import QRCode from "react-native-qrcode-svg";
import NfcManager from "react-native-nfc-manager";
import Invitation from "../models/Invitation";
import {selectInvitationById} from '../redux/reducers/invitationSlice';
import store from "../redux/store/Store";
import {base64urlEncodeMessage, getOobUrl} from "../utils/ConnectionUtils";
import {showGreenSnackBar, showRedSnackBar} from "../utils/Snackbar";
import {writeNdef} from "../utils/NFCUtils";

export const InvitationView = (props: { invitationId: string }) => {
    const invitationId: string = props.invitationId;
    const invitation: Invitation | undefined = selectInvitationById(store.getState(), invitationId)

    const [oobUrl, setOobUrl] = useState('error')
    const [modalVisible, setModalVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const showDialog = () => {
        setVisible(true)
        console.log('Waiting for write message to NFC Tag (' + Buffer.byteLength(oobUrl, 'utf-8') + ' bytes): ' + oobUrl)
        writeNdef(oobUrl).then(result => {
            if (result) {
                console.log('Successfully wrote invitation message to NFC Tag')
                showGreenSnackBar('Successfully wrote invitation message to NFC Tag')
                setVisible(false)
            } else {
                console.log('Failed to write invitation message to NFC Tag')
                showRedSnackBar('Failed to write invitation message to NFC Tag')
                setVisible(false)
            }
        })
    };
    const hideDialog = () => {
        NfcManager.cancelTechnologyRequest();
        setVisible(false)
    };

    useEffect(() => {
        if (invitation?.invitationMessage != null) {
            const base64urlEncodedMessage = base64urlEncodeMessage(invitation.invitationMessage.message)
            let url = getOobUrl(base64urlEncodedMessage)
            console.log('Invitation message (QR): ' + url)
            setOobUrl(url)
        }
    }, []);

    return (
        <ScrollView><View style={styles.qrView}>
            <QRCode
                size={300}
                value={oobUrl}
                //logo={{uri: base64Logo}}
                logoSize={30}
                logoBackgroundColor='transparent'/>
            <Text style={styles.labelText}>{invitation?.label}</Text>
            <Text
                style={{
                    marginBottom: 16,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 12
                }}>{invitation?.serviceEndpoints[0].serviceEndpoint ?? 'unknown'}</Text>
            <Chip style={styles.chip}>Goal: {invitation?.goal}</Chip>
            <Chip style={styles.chip} onPress={showModal}>See details</Chip>
            <Button mode={'outlined'} style={styles.buttonStyle} contentStyle={styles.buttonContentStyle}
                    onPress={showDialog}>Share</Button>
        </View><View>
            <Portal>
                <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.containerStyle}>
                    <ScrollView>
                        <List.Section>
                            <List.Subheader>Invitation details</List.Subheader>
                            <List.Item
                                title="Id"
                                description={invitation?.id}/>
                            <List.Item
                                title="State"
                                description={invitation?.state}/>
                            <List.Item
                                title="Created"
                                description={invitation?.created}/>
                            <List.Item
                                title="Expires"
                                description={invitation?.expires}/>
                            <List.Item
                                title="From"
                                description={invitation?.from}/>
                            <List.Item
                                title="Label"
                                description={invitation?.label}/>
                            <List.Item
                                title="Is multi?"
                                description={JSON.stringify(invitation?.multi)}/>
                            <List.Item
                                title="Goal code"
                                description={invitation?.goalCode}/>
                            <List.Item
                                title="Goal"
                                description={invitation?.goal}/>
                            <List.Item
                                title="Attachments"
                                description={JSON.stringify(invitation?.attachments)}/>
                            <List.Item
                                title="Service endpoints"
                                description={JSON.stringify(invitation?.serviceEndpoints)}/>
                            <List.Subheader>Invitation handshake details</List.Subheader>
                            <List.Item
                                title="Handshake protocol"
                                description={invitation?.handshakeProtocol}/>
                            <List.Item
                                title="Connection DID"
                                description={invitation?.connectionDID}/>
                            <List.Subheader>Message</List.Subheader>
                            <Text style={{
                                marginRight: 16,
                                marginLeft: 16
                            }}>{invitation?.invitationMessage?.message}</Text>
                        </List.Section>
                    </ScrollView>
                    <Button onPress={hideModal}>Close</Button>
                </Modal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>Write to NFC Tag</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Touch the NFC tag to the back of
                            the phone to write this invitation message to it.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>Exit</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View></ScrollView>);
}

const styles = StyleSheet.create({
    qrView: {
        margin: 32,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    labelText: {
        fontSize: 34,
        fontWeight: 'bold'
    },
    chip: {
        height: 40,
        margin: 8
    },
    buttonStyle: {
        height: 56,
        width: 200,
        margin: 16,
        marginTop: 32,
    },
    buttonContentStyle: {
        height: 56,
    },
    containerStyle: {
        backgroundColor: 'white',
        padding: 20,
        margin: 16
    }
})
