import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import DropDown from "react-native-paper-dropdown";
import {PresentationDefinition} from "../../models/PresentationDefinition";
import {selectAllDefinitions, selectDefinitionById} from "../../redux/reducers/DefinitionsSlice";
import store from "../../redux/store/Store";
import {Button} from "react-native-paper";
import IdentifierDetails from "../../models/IdentifierDetails";
import {getDefaultDID} from "../../utils/AgentUtils";
import {createProofInvitation} from "../../utils/ConnectionUtils";
import {connectionServer, verifierService} from "../../protocols/Protocols";
import ConnectionDetails from "../../models/ConnectionDetails";
import {showGreenSnackBar} from "../../utils/Snackbar";
import {createPresentation} from "../../utils/PresentationUtils";
import {goBack, navigate} from "../../navigation/StackNavigator";

export const ACMStartScreen = ({navigation}: { route: any, navigation: any }) => {
    const definitions: PresentationDefinition[] = selectAllDefinitions(store.getState())
    const defaultDID: IdentifierDetails | undefined = getDefaultDID()
    const [definitionId, setDefinitionId] = React.useState("");
    const [showDropDownDefinition, setShowDropDownDefinition] = useState(false);
    const possibleDefinitions: { label: string, value: string }[] = definitions.map((possibleDefinition: PresentationDefinition) => {
        return {
            label: possibleDefinition.name,
            value: possibleDefinition.id
        }
    })
    return (
        <View style={styles.container}>
            <DropDown
                label={"Select a presentation definition to use"}
                mode={"outlined"}
                visible={showDropDownDefinition}
                showDropDown={() => setShowDropDownDefinition(true)}
                onDismiss={() => setShowDropDownDefinition(false)}
                value={definitionId}
                setValue={setDefinitionId}
                list={possibleDefinitions}
            />
            <Button mode={'outlined'} style={styles.buttonStyle} contentStyle={styles.buttonContentStyle}
                    onPress={async () => {
                        // Create new invitation here
                        let definition: PresentationDefinition | undefined = selectDefinitionById(store.getState(), definitionId)
                        if (defaultDID && definition) {
                            let invitation = createProofInvitation(defaultDID, definition, async (connection: ConnectionDetails) => {
                                console.log('Invitation (' + invitation?.id + '): Successfully completed')
                                showGreenSnackBar('Invitation (' + invitation?.id + '): Successfully completed')
                                // Send presentation request here
                                if (definition) {
                                    let presentation = createPresentation(definition, connection, {
                                        onVerified: () => {
                                            console.log('Open ACMVerified')
                                            goBack()
                                            navigate('ACMVerified', {})
                                        },
                                        onDenied: () => {
                                            console.log('Open ACMDenied')
                                            goBack()
                                            navigate('ACMDenied', {})
                                        }
                                    })
                                    console.log('Presentation (' + presentation.id + '): Sending presentation request')
                                    await verifierService.sendPresentationRequest(presentation)
                                    console.log('Navigate to ACMAwaiting')
                                    goBack()
                                    navigate('ACMAwaiting', {})
                                }
                            })
                            if (invitation) {
                                await connectionServer.sendInvitation(invitation)
                                navigation.navigate('ACMInvitation', {invitationId: invitation.id})
                            }
                        }
                    }}>Start access control module</Button>
        </View>);
}

const styles = StyleSheet.create({
    container: {
        margin: 16
    },
    buttonStyle: {
        height: 56,
        marginTop: 32,
        justifyContent: 'center'
    },
    buttonContentStyle: {
        height: 56,
    }
})
