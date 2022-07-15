import * as React from "react";
import {useState} from "react";
import {useSelector} from "react-redux";
import {selectAllConnection, selectConnectionById} from "../../redux/reducers/connectionsSlice";
import {getDisplayName} from "../../utils/AgentUtils";
import {View} from "react-native";
import {Button, Dialog, List, Portal} from "react-native-paper";
import DropDown from "react-native-paper-dropdown";
import ConnectionDetails from "../../models/ConnectionDetails";
import store from "../../redux/store/Store";
import {messageHandler, trustPing} from "../../protocols/Protocols";

export const PingTestDialog = ({visible, setVisible}: { visible: boolean, setVisible: (visible: boolean) => void }) => {

    const [pingResponsesReceived, setPingResponsesReceived] = useState<number>(0);
    const [connectionId, setConnectionId] = useState<string>('');
    const [showDropDownConnection, setShowDropDownConnection] = useState(false);
    const possibleConnections: { label: string, value: string }[] = useSelector(selectAllConnection).filter((connection) => connection.state == 'completed').map((possibleConnections) => {
        return {
            label: getDisplayName(possibleConnections.theirDID!),
            value: possibleConnections.id
        }
    })
    const sendPingTest = async (connection: ConnectionDetails) => {
        await trustPing.sendPing(connection.yourDID, connection.theirDID, async () => {
            let pingResponsesReceived: number
            setPingResponsesReceived(prevState => {
                pingResponsesReceived = prevState + 1
                console.log('pingResponsesReceived: ' + pingResponsesReceived)
                if (pingResponsesReceived < 100) {
                    sendPingTest(connection)
                }
                return pingResponsesReceived
            })
        })
    }
    return (
        <View>
            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Title>Send and receive pings</Dialog.Title>
                    <Dialog.Content style={{flexDirection: 'column'}}>
                        <List.Item
                            title="bluetoothClientConnectedDevice"
                            descriptionNumberOfLines={5}
                            description={JSON.stringify(messageHandler.bluetoothClient.connectedDevice)}/>
                        <List.Item
                            title="bluetoothServerConnectedDevice"
                            descriptionNumberOfLines={5}
                            description={JSON.stringify(messageHandler.bluetoothServer.connectedDevice)}/>
                        <List.Item
                            title="pingResponsesReceived"
                            description={JSON.stringify(pingResponsesReceived)}/>
                        <View>
                            <DropDown
                                label={"Select connection to use for sending"}
                                mode={"outlined"}
                                visible={showDropDownConnection}
                                showDropDown={() => setShowDropDownConnection(true)}
                                onDismiss={() => setShowDropDownConnection(false)}
                                value={connectionId}
                                setValue={setConnectionId}
                                list={possibleConnections}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setVisible(false)
                        }}>Cancel</Button>
                        <Button onPress={async () => {
                            let connection: ConnectionDetails | undefined = selectConnectionById(store.getState(), connectionId)
                            setPingResponsesReceived(0)
                            if (connection) {
                                await sendPingTest(connection)
                            }
                            //setVisible(false)
                        }}>Start</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    )
}
