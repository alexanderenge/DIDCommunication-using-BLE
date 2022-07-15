import * as React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Avatar, Card, Chip, Divider, Modal, Portal} from "react-native-paper";
import Presentation, {CandidateCredential} from "../models/Presentation";
import {VerifiableCredential} from "@veramo/core/src/types/vc-data-model";

export const PresentationView = ({
                                     navigation,
                                     presentation,
                                     candidateCredentials
                                 }: { navigation: any, presentation: Presentation, candidateCredentials: CandidateCredential[] }) => {

    const [modalVisible, setModalVisible] = React.useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    return (<ScrollView>
            <View style={styles.container}>
                <Text style={styles.header}>{presentation?.definition?.name}</Text>
                <Text>{presentation?.definition?.purpose}</Text>
                <Divider style={{marginTop: 24, marginBottom: 8, width: '100%'}}/>
                <Text style={styles.header1}>Required input</Text>
                {presentation?.definition?.input_descriptors.map((inputDescriptor, index) => {
                    return (
                        <Card style={{width: '100%'}}>
                            <Card.Title title={inputDescriptor.name} titleStyle={{fontSize: 16}}
                                        subtitle={inputDescriptor.purpose}/>
                            <Card.Content>
                                {inputDescriptor.constraints?.fields.map((constraintField) => {
                                    return (
                                        <><Portal>
                                            <Modal visible={modalVisible} onDismiss={hideModal}
                                                   contentContainerStyle={styles.modalStyle}>
                                                <Text>{JSON.stringify(constraintField)}</Text>
                                            </Modal>
                                        </Portal><Chip style={{height: 56, marginTop: 8}} icon="label-outline"
                                                       onPress={() => {
                                                           console.log(JSON.stringify(constraintField));
                                                           showModal();
                                                       }}>{constraintField.purpose}</Chip></>
                                    );
                                })}
                            </Card.Content>
                            <Divider style={{marginTop: 16}}/>
                            <Card.Actions>
                                {candidateCredentials.find(candidateCredential => {
                                    if (candidateCredential.input_descriptor.id == inputDescriptor.id) {
                                        return candidateCredential
                                    }
                                })?.credential ? (
                                    <Chip style={{marginTop: 8, marginBottom: 8}} mode={'outlined'}
                                          avatar={<Avatar.Icon size={28} color='#FFFFFF'
                                                               style={{backgroundColor: '#18A73E'}}
                                                               icon="check-circle-outline"/>}
                                          onPress={() => {
                                              if (presentation.submission?.verifiableCredential) {
                                                  let vc: VerifiableCredential = presentation.submission?.verifiableCredential[index] as VerifiableCredential
                                                  navigation.navigate('CredentialView', {credentialId: vc.id})
                                              }
                                          }}>Inserted
                                        matching
                                        credential</Chip>
                                ) : (
                                    <Chip style={{marginTop: 16}} mode={'outlined'}
                                          avatar={<Avatar.Icon size={28} color='#FFFFFF'
                                                               style={{backgroundColor: '#F83434'}}
                                                               icon="close-circle-outline"/>}
                                          onPress={() => console.log('Not valid')}>Input credential missing</Chip>
                                )}
                            </Card.Actions>
                        </Card>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 8,
        alignItems: 'center'
    },
    chip: {
        height: 40,
        marginTop: 8,
        marginBottom: 8
    },
    header: {
        margin: 16,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333'
    },
    header1: {
        margin: 16,
        fontSize: 14,
        fontWeight: 'bold'
    },
    modalStyle: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20
    }
})
