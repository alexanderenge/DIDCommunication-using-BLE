import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, DataTable} from "react-native-paper";
import {useSelector} from "react-redux";
import {SafeAreaView} from "react-native-safe-area-context";
import {PresentationDefinition} from "../../models/PresentationDefinition";
import {selectAllDefinitions} from "../../redux/reducers/DefinitionsSlice";
import {Header} from "../../components/Header";

export const DefinitionsScreen = ({navigation}: { navigation: any }) => {
    const definitions: PresentationDefinition[] = useSelector(selectAllDefinitions)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Create" icon="plus-circle-outline" onPress={async () => {
                navigation.navigate('DefinitionCreate')
            }}/>
        })
    })
    const DefinitionsTable = () => <View style={styles.container}>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title style={{flex: 4}}>Name</DataTable.Title>
                <DataTable.Title style={{flex: 2}}>Action</DataTable.Title>
            </DataTable.Header>
            {definitions.map((definition) => (
                <DataTable.Row key={definition.id}
                               onPress={() => {
                                   navigation.navigate('DefinitionView', {definitionId: definition.id})
                               }}>
                    <DataTable.Cell style={{flex: 4}}>{definition.name}</DataTable.Cell>
                    <DataTable.Cell style={{flex: 2}}>
                        <Button onPress={() => {
                            navigation.navigate('RequestPresentation', {definitionId: definition.id})
                        }}>Request</Button>
                    </DataTable.Cell>
                </DataTable.Row>
            ))}
        </DataTable>
    </View>
    return (<SafeAreaView>
        <ScrollView>
            <DefinitionsTable/>
        </ScrollView>
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    container: {
        padding: 8
    },
});
