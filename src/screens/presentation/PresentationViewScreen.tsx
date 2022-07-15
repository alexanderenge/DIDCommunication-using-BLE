import * as React from 'react';
import {useLayoutEffect} from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../redux/reducers/rootReducer";
import {List} from "react-native-paper";
import Chat from "../../models/Chat";
import Presentation from "../../models/Presentation";
import {deletePresentation, selectPresentationById} from "../../redux/reducers/presentationsSlice";
import {getChat} from "../../utils/ChatUtils";
import {Header} from "../../components/Header";

export const PresentationViewScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const presentationId: string = route.params.presentationId;
    const presentation: Presentation | undefined = useSelector((state: RootState) => selectPresentationById(state, presentationId))
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Delete" icon="delete-outline" onPress={async () => {
                dispatch(deletePresentation(presentationId))
                console.log('Deleted successfully')
                navigation.goBack()
            }}/>
        })
    })

    return (<ScrollView>
        <List.Section>
            <List.Subheader>Presentation</List.Subheader>
            <List.Item
                title="View connection"
                disabled={presentation?.connection == undefined}
                titleStyle={presentation?.connection == undefined ? styles.listItemDisabled : {}}
                onPress={() => {
                    if (presentation?.connection) {
                        navigation.navigate('ConnectionView', {
                            connectionId: presentation.connection.id
                        })
                    }
                }}
                right={props => <List.Icon {...props} icon="arrow-right"/>}/>
            <List.Item
                title="View presentation submission"
                disabled={presentation?.submission == undefined}
                titleStyle={presentation?.submission == undefined ? styles.listItemDisabled : {}}
                onPress={() => {
                    if (presentation?.definition) {
                        navigation.navigate('SubmissionView', {
                            presentationId: presentation.id
                        })
                    }
                }}
                right={props => <List.Icon {...props} icon="arrow-right"/>}/>
            <List.Item
                title="Send presentation request"
                disabled={presentation?.state != "initial"}
                titleStyle={presentation?.state != "initial" ? styles.listItemDisabled : {}}
                onPress={() => {
                    if (presentation) {
                        console.log('Send presentation: ' + JSON.stringify(presentation))
                        // Lookup existing chat for this from(issuer)/to(subject) pair
                        let validator = presentation.connection.yourDID
                        let prover = presentation.connection.theirDID!
                        let chat: Chat = getChat(validator, prover)
                        navigation.navigate('ChatMessages', {
                            chatId: chat.id,
                            presentationId: presentation.id
                        })
                    }
                }}
                right={props => <List.Icon {...props} icon="arrow-right"/>}/>
            <List.Item
                title="Send presentation response"
                disabled={presentation?.state != "request-received"}
                titleStyle={presentation?.state != "request-received" ? styles.listItemDisabled : {}}
                onPress={() => {
                    if (presentation) {
                        navigation.navigate('PresentationConfirm', {
                            presentationId: presentation.id
                        })
                    }
                }}
                right={props => <List.Icon {...props} icon="arrow-right"/>}/>
            <List.Subheader>Presentation definition</List.Subheader>
            <List.Item
                title="Definition id"
                description={presentation?.definition?.id}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition name"
                description={presentation?.definition?.name}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition purpose"
                description={presentation?.definition?.purpose}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Definition input descriptors"
                description={JSON.stringify(presentation?.definition?.input_descriptors)}
                descriptionNumberOfLines={50}
            />
            <List.Subheader>Presentation submission</List.Subheader>
            <List.Item
                title="Submission id"
                description={presentation?.submission?.presentationSubmission.id}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Submission definition id"
                description={presentation?.submission?.presentationSubmission.definition_id}
                descriptionNumberOfLines={20}
            />
            <List.Item
                title="Submission descriptor map"
                description={JSON.stringify(presentation?.submission?.presentationSubmission.descriptor_map)}
                descriptionNumberOfLines={20}
            />
            <List.Subheader>Presentation json</List.Subheader>
            <Text style={styles.container}>{JSON.stringify(presentation?.vp)}</Text>
            <List.Subheader>Presentation raw</List.Subheader>
            <Text style={styles.container}>{JSON.stringify(presentation)}</Text>
        </List.Section>
    </ScrollView>);
}

const styles = StyleSheet.create({
    container: {
        marginLeft: 16,
        marginRight: 16
    },
    button: {
        marginTop: 8,
        marginBottom: 8,
    },
    chip: {
        height: 40,
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    listItemDisabled: {
        color: '#AAAAAA'
    }
})
