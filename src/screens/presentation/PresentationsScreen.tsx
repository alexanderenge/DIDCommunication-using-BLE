import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {DataTable} from "react-native-paper";
import {useSelector} from "react-redux";
import {SafeAreaView} from "react-native-safe-area-context";
import {selectAllPresentations} from "../../redux/reducers/presentationsSlice";
import {Header} from "../../components/Header";
import Presentation from "../../models/Presentation";

export const PresentationsScreen = ({navigation}: { navigation: any }) => {
    const presentations: Presentation[] = useSelector(selectAllPresentations)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Definitions"
                                       onPress={() => navigation.navigate('Definitions')}/>
        })
    })
    const PresentationsTable = () => <View style={styles.container}>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title style={{flex: 3}}>Definition name</DataTable.Title>
                <DataTable.Title style={{flex: 2}}>State</DataTable.Title>
            </DataTable.Header>
            {presentations.map((presentation) => (
                <DataTable.Row key={presentation.id}
                               onPress={() => navigation.navigate('PresentationView', {presentationId: presentation.id})}>
                    <DataTable.Cell style={{flex: 3}}>{presentation.definition?.name}</DataTable.Cell>
                    <DataTable.Cell style={{flex: 2}}>{presentation.state}</DataTable.Cell>
                </DataTable.Row>
            ))}
        </DataTable>
    </View>
    return (<SafeAreaView>
        <ScrollView>
            <PresentationsTable/>
        </ScrollView>
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    container: {
        padding: 8
    },
});
