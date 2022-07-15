import * as React from 'react';
import {useEffect, useState} from 'react';
import {Avatar, Chip, Divider, List, Text} from 'react-native-paper';
import {StyleSheet, View} from 'react-native';
import {useSelector} from "react-redux";
import {RootState} from "../redux/reducers/rootReducer";
import IdentifierDetails from "../models/IdentifierDetails";
import {selectIdentifierDetailById} from "../redux/reducers/identifierDetailsSlice";
import {createConnectInvitation} from "../utils/ConnectionUtils";
import {copyDIDToClipboard} from "../utils/AgentUtils";
import {connectionServer, messageHandler} from "../protocols/Protocols";
import {showGreenSnackBar} from "../utils/Snackbar";

export const ProfileScreen = ({navigation}: { navigation: any }) => {
    const defaultDID: IdentifierDetails | undefined = useSelector((state: RootState) => selectIdentifierDetailById(state, state.agent.defaultIdentifier))
    const [isAdvertising, setIsAdvertising] = useState<boolean>(messageHandler.bluetoothServer.isAdvertising)
    useEffect(() => {
        return navigation.addListener('focus', async () => {
            setIsAdvertising(messageHandler.bluetoothServer.isAdvertising)
        });
    }, [navigation]);
    const Connect = () => {
        return (
            <Chip style={style.flexItem} icon="account-multiple-plus-outline"
                  onPress={async () => {
                      if (defaultDID) {
                          let invitation = createConnectInvitation(defaultDID, () => {
                              console.log('Invitation (' + invitation?.id + '): Successfully completed')
                              showGreenSnackBar('Invitation (' + invitation?.id + '): Successfully completed')
                          })
                          if (invitation) {
                              await connectionServer.sendInvitation(invitation)
                              navigation.navigate('InvitationView', {invitationId: invitation.id})
                          }
                      }
                  }}>Connect</Chip>
        );
    }
    return (
        <><List.Item
            title={defaultDID?.name ?? 'Default DID Name'}
            description={defaultDID?.did ?? 'Unknown'}
            onPress={() => {
                if (defaultDID) {
                    navigation.navigate('IdentifierView', {identifier: defaultDID?.did});
                }
            }}
            left={() => <Avatar.Icon icon="account"/>}/>
            <View style={{flexDirection: 'row'}}>
                <Chip style={style.flexItem} icon="content-copy" onPress={() => copyDIDToClipboard(defaultDID?.did)}>Copy
                    DID</Chip>
                <Connect/>
            </View>
            <Divider style={{marginTop: 8}}/>
            <List.Section>
                <List.Subheader>Agent & wallet</List.Subheader>
                <List.Item
                    title="Agent endpoints"
                    description={isAdvertising ? <View style={{flexDirection: 'row'}}>
                        <Text style={{color: '#888888'}}>Bluetooth Messaging is Running</Text>
                        <Avatar.Icon size={20} color='#18A73E' icon="check-circle-outline"
                                     style={{backgroundColor: 'rgba(52, 52, 52, 0)'}}/>
                    </View> : <View style={{flexDirection: 'row'}}>
                        <Text style={{color: '#888888'}}>Bluetooth Messaging is Stopped</Text>
                        <Avatar.Icon size={20} color='#F83434' icon="check-circle-outline"
                                     style={{backgroundColor: 'rgba(52, 52, 52, 0)'}}/>
                    </View>}
                    onPress={() => {
                        navigation.navigate('AgentEndpoints');
                    }}
                    left={props => <List.Icon {...props} icon="cellphone-wireless"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Decentralized identifiers"
                    onPress={() => {
                        navigation.navigate('Identifiers');
                    }}
                    left={props => <List.Icon {...props} icon="account-outline"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Connections"
                    onPress={() => {
                        navigation.navigate('Connections');
                    }}
                    left={props => <List.Icon {...props} icon="account-multiple-outline"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Invitations"
                    onPress={() => {
                        navigation.navigate('Invitations');
                    }}
                    left={props => <List.Icon {...props} icon="card-text-outline"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Credentials"
                    onPress={() => {
                        navigation.navigate('Credentials');
                    }}
                    left={props => <List.Icon {...props} icon="card-account-details-outline"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Presentations"
                    onPress={() => {
                        navigation.navigate('Presentations');
                    }}
                    left={props => <List.Icon {...props} icon="credit-card-scan"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
                <List.Item
                    title="Settings"
                    onPress={() => {
                        navigation.navigate('Settings');
                    }}
                    left={props => <List.Icon {...props} icon="application-settings-outline"/>}
                    right={props => <List.Icon {...props} icon="arrow-right"/>}/>
            </List.Section></>
    );
}

const style = StyleSheet.create({
    flexItem: {
        margin: 8,
        marginRight: 4
    }
})
