import * as React from 'react';
import {useLayoutEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {TextInput} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {useSelector} from "react-redux";
import {RootState} from "../../redux/reducers/rootReducer";
import DropDown from "react-native-paper-dropdown";
import {selectDefinitionById} from "../../redux/reducers/DefinitionsSlice";
import {PresentationDefinition} from "../../models/PresentationDefinition";
import {selectAllConnection, selectConnectionById} from "../../redux/reducers/connectionsSlice";
import {createPresentation} from "../../utils/PresentationUtils";
import ConnectionDetails from "../../models/ConnectionDetails";
import store from "../../redux/store/Store";
import {showGreenSnackBar, showRedSnackBar, showSnackBar} from "../../utils/Snackbar";
import {getDisplayName} from "../../utils/AgentUtils";
import {Header} from "../../components/Header";

export const RequestPresentationScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const definitionId: string = route.params.definitionId;
    const [definition, setDefinition] = React.useState<PresentationDefinition>(useSelector((state: RootState) => selectDefinitionById(state, definitionId))!);
    const [connectionId, setConnectionId] = React.useState<string>('');
    const [showDropDownConnection, setShowDropDownConnection] = useState(false);
    const possibleConnections: { label: string, value: string }[] = useSelector(selectAllConnection).filter((connection) => connection.state == 'completed').map((possibleConnections) => {
        return {
            label: getDisplayName(possibleConnections.theirDID!),
            value: possibleConnections.id
        }
    })

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Save" icon="plus-circle-outline" onPress={async () => {
                let connection: ConnectionDetails | undefined = selectConnectionById(store.getState(), connectionId)
                if (connection) {
                    let presentation = createPresentation(definition, connection, {
                        onVerified: () => {
                            console.log('Successfully verified presentation id = ' + presentation.id)
                            showGreenSnackBar('Successfully verified presentation id = ' + presentation.id)
                        },
                        onDenied: () => {
                            console.log('Failed to verify presentation id = ' + presentation.id)
                            showRedSnackBar('Failed to verify presentation id = ' + presentation.id)
                        }
                    })
                    navigation.goBack()
                } else {
                    showSnackBar('Connection is not specified')
                }
            }}/>
        })
    })
    return (<SafeAreaView>
        <ScrollView>
            <View style={styles.container}>
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    label="Definition Id"
                    disabled={true}
                    value={definition.id}
                />
                <View style={styles.inputfield}>
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
            </View>
        </ScrollView>
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    inputfield: {
        marginBottom: 8
    }
});
