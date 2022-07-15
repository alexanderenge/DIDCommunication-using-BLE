import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {createIdentifier} from "../utils/AgentUtils";
import IdentifierDetails from "../models/IdentifierDetails";
import {addIdentifierDetail} from "../redux/reducers/identifierDetailsSlice";
import {useDispatch} from "react-redux";
import {setDefaultIdentifer} from "../redux/reducers/agentSlice";
import {showGreenSnackBar} from "../utils/Snackbar";
import Schema from "../models/Schema";
import {v4 as uuidv4} from "uuid";
import {addSchema} from "../redux/reducers/SchemasSlice";

export const SetupScreen = ({navigation}: { route: any, navigation: any }) => {
    const dispatch = useDispatch();
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Setup</Text>
            <Text style={styles.text}>Click "Next" to configure agent & wallet. This will setup the messaging
                application and generate a default DID (did:key)</Text>
            <Button mode={'contained'} style={styles.buttonStyle} contentStyle={styles.buttonContentStyle}
                    labelStyle={styles.buttonLabelStyle} onPress={() => {
                createIdentifier('DID Name 0').then((identifier: IdentifierDetails | undefined) => {
                    if (identifier) {
                        let schema: Schema = {
                            attributes: ['name', 'role'],
                            description: 'An access control verifiable credential',
                            id: uuidv4(),
                            name: 'Default ACVC',
                            version: '1.0',
                            credential: {
                                context: ['https://www.w3.org/2018/credentials/v1', 'https://example.com/contexts/acvc/v1'],
                                type: ['VerifiableCredential', 'AccessControl'],
                                proofFormat: 'lds'
                            }
                        }
                        dispatch(addSchema(schema))
                        dispatch(addIdentifierDetail(identifier))
                        dispatch(setDefaultIdentifer(identifier.did))
                        showGreenSnackBar('Agent & wallet successfully initialized')
                    }
                })
                navigation.navigate('HomeStack')
            }}>Next</Button>
        </View>);
}

const styles = StyleSheet.create({
    header: {
        alignSelf: 'center',
        fontSize: 64,
        fontWeight: 'bold',
        margin: 16
    },
    text: {
        margin: 16,
        alignSelf: 'center',
        textAlign: 'center'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },
    buttonStyle: {
        height: 56,
        marginTop: 32,
        justifyContent: 'center'
    },
    buttonContentStyle: {
        height: 56,
    },
    buttonLabelStyle: {
        color: "white"
    },
})
