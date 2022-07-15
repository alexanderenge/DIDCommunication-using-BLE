import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../redux/reducers/rootReducer";
import {List} from "react-native-paper";
import {deleteDefinition, selectDefinitionById} from "../../redux/reducers/DefinitionsSlice";
import {PresentationDefinition} from "../../models/PresentationDefinition";
import {Header} from "../../components/Header";

export const DefinitionViewScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const definitionId: string = route.params.definitionId;
    const definition: PresentationDefinition = useSelector((state: RootState) => selectDefinitionById(state, definitionId))!
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                <Header title="Delete" icon="delete-outline" onPress={() => {
                    dispatch(deleteDefinition(definitionId))
                    console.log('Deleted successfully')
                    navigation.goBack()
                }}/>
        })
    })

    return (<ScrollView>
        <List.Section>
            <List.Subheader>Details</List.Subheader>
            <List.Item
                title="Definition id"
                description={definition?.id}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition name"
                description={definition?.name}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition purpose"
                description={definition?.purpose}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition input descriptors"
                description={JSON.stringify(definition?.input_descriptors)}
                descriptionNumberOfLines={50}
            />
            <List.Subheader>Definition raw</List.Subheader>
            <Text style={styles.container}>{JSON.stringify(definition)}</Text>
        </List.Section>
    </ScrollView>);
}

const styles = StyleSheet.create({
    container: {
        marginLeft: 16,
        marginRight: 16
    }
})
