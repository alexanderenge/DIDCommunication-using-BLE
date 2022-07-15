import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
    Avatar,
    Button,
    Card,
    Chip,
    DataTable,
    Dialog,
    Divider,
    IconButton,
    List,
    Paragraph,
    Portal,
    Text,
    TextInput
} from "react-native-paper";
import {DIDResolutionResult, IService} from "@veramo/core";
import {useDispatch, useSelector} from "react-redux";
import {setDefaultIdentifer} from "../../redux/reducers/agentSlice";
import {
    deleteIdentifierDetail,
    selectIdentifierDetailById,
    updateIdentifierDetail
} from "../../redux/reducers/identifierDetailsSlice";
import IdentifierDetails from "../../models/IdentifierDetails";
import {RootState} from "../../redux/reducers/rootReducer";
import {showGreenSnackBar, showRedSnackBar} from "../../utils/Snackbar";
import ConnectionDetails from "../../models/ConnectionDetails";
import {selectAllConnection} from "../../redux/reducers/connectionsSlice";
import Invitation from "../../models/Invitation";
import {addBLEService, copyDIDToClipboard} from "../../utils/AgentUtils";
import {createConnectInvitation} from "../../utils/ConnectionUtils";
import {agent} from "../../veramo/setup";
import {connectionServer} from "../../protocols/Protocols";
import {Header} from "../../components/Header";

export const IdentifierViewScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const identifier: string = route.params.identifier;
    const identifierDetails: IdentifierDetails = useSelector((state: RootState) => selectIdentifierDetailById(state, identifier))!

    const [visible, setVisible] = React.useState(false);
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);

    const dispatch = useDispatch();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Delete" icon="delete-outline" onPress={async () => {
                const success = await agent.didManagerDelete({did: identifierDetails.did})
                if (success) {
                    dispatch(deleteIdentifierDetail(identifierDetails.did))
                    console.log('Deleted successfully')
                    navigation.goBack()
                }
            }}/>
        })
    })
    const ChangeDidNameDialog = () => {
        const [didName, setDidName] = React.useState(identifierDetails?.name);
        return (
            <View>
                <Portal>
                    <Dialog visible={visible} onDismiss={hideDialog}>
                        <Dialog.Title>Change DID Name</Dialog.Title>
                        <Dialog.Content style={{flexDirection: 'column'}}>
                            <TextInput
                                style={styles.inputfield}
                                mode={'outlined'}
                                label="DID Name"
                                value={didName}
                                onChangeText={text => setDidName(text)}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => {
                                hideDialog()
                            }}>Close</Button>
                            <Button disabled={!didName} onPress={() => {
                                dispatch(updateIdentifierDetail({
                                    id: identifierDetails.did,
                                    changes: {
                                        name: didName
                                    }
                                }))
                                hideDialog()
                            }}>Save</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        )
    }

    const DIDHeader = () => <List.Item
        title={identifierDetails?.name}
        description={identifierDetails?.did}
        onPress={() => {
            showDialog()
        }}
        left={() => <Avatar.Icon icon="account"/>}/>

    const LeftContent = (props: any) => <Avatar.Icon {...props} icon="access-point"/>
    const ServiceComponent = (service: IService) => (
        <Card style={{marginTop: 8}}>
            <Card.Title title={service.type}
                        titleStyle={{fontSize: 16}}
                        subtitle={service.serviceEndpoint} subtitleNumberOfLines={2}
                        left={LeftContent}
                        right={(props) => <IconButton {...props} icon="delete-outline" onPress={async () => {
                            let services: IService[] = [...identifierDetails.services]
                            let index = services.indexOf(services.find(x => x.id === service.id)!);
                            if (index !== -1) {
                                services.splice(index, 1);
                            }
                            dispatch(updateIdentifierDetail({
                                id: identifierDetails.did,
                                changes: {services: services},
                            }))
                        }}/>}/>
            <Card.Content>
                <Paragraph>{service.description}</Paragraph>
            </Card.Content>
        </Card>
    );

    const connectionDetails: ConnectionDetails[] = useSelector(selectAllConnection)
    const ConnectionsTable = () => <View style={styles.container}>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title>DID</DataTable.Title>
            </DataTable.Header>
            {connectionDetails?.filter((connection) => connection.state === 'completed' && connection.yourDID === identifierDetails.did).map((details) => {
                const theirDID: IdentifierDetails | undefined = useSelector((state: RootState) => selectIdentifierDetailById(state, details.theirDID!))
                return (
                    <DataTable.Row key={details.id}
                                   onPress={() => navigation.navigate('ConnectionView', {connectionId: details.id})}>
                        <DataTable.Cell>{theirDID?.name}</DataTable.Cell>
                        <DataTable.Cell>{theirDID?.did}</DataTable.Cell>
                    </DataTable.Row>
                )
            })}
        </DataTable>
    </View>
    const Connect = () => {
        return (
            <Chip style={styles.flexItem} icon="account-multiple-plus-outline"
                  onPress={async () => {
                      if (identifierDetails) {
                          let invitation: Invitation | undefined = createConnectInvitation(identifierDetails, () => {
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
    return identifierDetails?.owned ? (<ScrollView>
                <DIDHeader/>
                <ChangeDidNameDialog/>
                <View style={{flexDirection: 'row'}}>
                    <Chip style={styles.flexItem} icon="account-switch-outline"
                          onPress={() => {
                              dispatch(setDefaultIdentifer(identifierDetails?.did))
                              showGreenSnackBar('This is now used as your default DID')
                          }}>Set default</Chip>
                    <Chip style={styles.flexItem} icon="content-copy"
                          onPress={() => copyDIDToClipboard(identifierDetails?.did)}>Copy DID</Chip>
                    <Connect/>
                </View>
                <Divider style={{marginTop: 8, marginBottom: 8}}/>
                <View style={styles.container}>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text>Services</Text>
                        <Chip icon="plus-circle-outline" onPress={() => {
                            addBLEService(identifierDetails)
                        }}>Add Bluetooth</Chip>
                    </View>
                    {identifierDetails?.services.map((service) => (
                        <ServiceComponent key={service.id} id={service.id} type={service.type}
                                          serviceEndpoint={service.serviceEndpoint}
                                          description={service.description}/>
                    ))}
                    <Divider style={{marginTop: 16, marginBottom: 16}}/>
                    <Text>Keys</Text>
                    <Text>{JSON.stringify(identifierDetails?.keys)}</Text>
                    <Divider style={{marginTop: 16, marginBottom: 16}}/>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text>DID Document</Text>
                        <Chip onPress={async () => {
                            let result: DIDResolutionResult = await agent.resolveDid({didUrl: identifierDetails.did})
                            console.log(result.didDocument)
                            if (result.didDocument) {
                                dispatch(updateIdentifierDetail({
                                    id: identifierDetails.did,
                                    changes: {didDocument: result.didDocument},
                                }))
                                showGreenSnackBar('Successfully resolved DID document')
                            } else {
                                showRedSnackBar('Failed to resolve DID document')
                            }
                        }}>Resolve</Chip>
                    </View>
                    <Text>{JSON.stringify(identifierDetails?.didDocument)}</Text>
                    <Divider style={{marginTop: 16, marginBottom: 16}}/>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text>Connections</Text>
                    </View>
                    <ConnectionsTable/>
                </View>
            </ScrollView>
        )
        :
        (<ScrollView>
                <DIDHeader/>
                <ChangeDidNameDialog/>
                <Divider style={{marginTop: 8, marginBottom: 8}}/>
                <View style={styles.container}>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text>Services</Text>
                    </View>
                    <Text>{JSON.stringify(identifierDetails?.services)}</Text>
                    <Divider style={{marginTop: 16, marginBottom: 16}}/>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <Text>DID Document</Text>
                        <Chip icon="plus-circle-outline" onPress={async () => {
                            let result: DIDResolutionResult = await agent.resolveDid({didUrl: identifierDetails.did})
                            if (result.didDocument) {
                                dispatch(updateIdentifierDetail({
                                    id: identifierDetails.did,
                                    changes: {didDocument: result.didDocument},
                                }))
                            }
                        }}>Resolve</Chip>
                    </View>
                    <Text>{JSON.stringify(identifierDetails?.didDocument)}</Text>
                </View>
            </ScrollView>
        );
}

const styles = StyleSheet.create({
    flexItem: {
        margin: 8,
        marginRight: 4
    },
    container: {
        margin: 8,
    },
    inputfield: {
        marginBottom: 8
    }
})
