import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";
import {DataTable} from "react-native-paper";
import {useDispatch, useSelector} from "react-redux";
import {addIdentifierDetail, selectAllIdentifierDetails} from "../../redux/reducers/identifierDetailsSlice";
import IdentifierDetails from "../../models/IdentifierDetails";
import {createIdentifier} from "../../utils/AgentUtils";
import {Header} from "../../components/Header";

export const IdentifiersScreen = ({navigation}: { navigation: any }) => {
    const identifierDetails: IdentifierDetails[] = useSelector(selectAllIdentifierDetails)
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Create" icon="plus-circle-outline" onPress={() => {
                createIdentifier('DID Name ' + identifierDetails.length).then((identifier: IdentifierDetails | undefined) => {
                    if (identifier) {
                        dispatch(addIdentifierDetail(identifier))
                    }
                })
            }
            }/>
        })
    })

    const IdentifiersTable = () => <View style={styles.container}>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title style={{flex: 3}}>DID Name</DataTable.Title>
                <DataTable.Title style={{flex: 5}}>DID</DataTable.Title>
            </DataTable.Header>


            {identifierDetails.map((details) => {
                if (details.owned) {
                    return (
                        <DataTable.Row key={details.did}
                                       onPress={() => navigation.navigate('IdentifierView', {identifier: details.did})}>
                            <DataTable.Cell style={{flex: 3}}>{details.name}</DataTable.Cell>
                            <DataTable.Cell style={{flex: 5}}>{details.did}</DataTable.Cell>
                        </DataTable.Row>
                    )
                }
            })}

        </DataTable>
    </View>
    return (<SafeAreaView>
        <ScrollView>
            <IdentifiersTable/>
        </ScrollView>
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    container: {
        padding: 8
    },
});


