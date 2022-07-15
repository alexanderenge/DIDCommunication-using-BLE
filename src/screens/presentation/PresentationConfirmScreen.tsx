import * as React from 'react';
import {PresentationView} from "../../components/PresentationView";
import Presentation, {CandidateCredential} from "../../models/Presentation";
import {useSelector} from "react-redux";
import {RootState} from "../../redux/reducers/rootReducer";
import {selectPresentationById, updatePresentation} from "../../redux/reducers/presentationsSlice";
import {selectAllCredentials} from "../../redux/reducers/credentialsSlice";
import store from "../../redux/store/Store";
import {findCandidateCredentials, generatePresentationSubmission} from "../../utils/PresentationUtils";
import {Avatar, Chip, Divider} from "react-native-paper";
import {View} from "react-native";
import {GeneratedPresentationSubmission} from "../../models/PresentationSubmission";
import {showGreenSnackBar, showRedSnackBar} from "../../utils/Snackbar";
import {proverService} from "../../protocols/Protocols";
import {VerifiableCredential} from "@veramo/core";

export const PresentationConfirmScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const presentationId: string = route.params.presentationId;
    const presentation: Presentation = useSelector((state: RootState) => selectPresentationById(state, presentationId))!
    const credentials: VerifiableCredential[] = selectAllCredentials(store.getState()).filter((credential) => !credential.issued).map((credential) => credential.verifiableCredential) // Credentials used to see if there is any match against the definition
    const candidateCredentials: CandidateCredential[] = findCandidateCredentials(presentation, credentials)
    return (
        <>
            <PresentationView navigation={navigation} presentation={presentation}
                              candidateCredentials={candidateCredentials}/>
            <Divider/>
            <View
                style={{flexDirection: 'row', alignContent: 'space-between', margin: 8}}>
                <Chip style={{height: 56, flexGrow: 1, marginRight: 8}} mode={'outlined'}
                      avatar={<Avatar.Icon size={28} color='#F83434'
                                           style={{backgroundColor: '#FFFFFF', marginLeft: 32}}
                                           icon="close-circle-outline"/>}
                      onPress={() => navigation.goBack()}>Cancel</Chip>
                <Chip style={{height: 56, flexGrow: 1, marginRight: 8}} mode={'outlined'}
                      avatar={<Avatar.Icon size={28} color='#18A73E'
                                           style={{backgroundColor: '#FFFFFF', marginLeft: 32}}
                                           icon="check-circle-outline"/>}
                      onPress={() => {
                          let generatedPresentationSubmission: GeneratedPresentationSubmission | undefined = generatePresentationSubmission(presentation, candidateCredentials);
                          if (generatedPresentationSubmission) {
                              store.dispatch(updatePresentation({
                                  id: presentation.id,
                                  changes: {
                                      submission: generatedPresentationSubmission
                                  },
                              }));
                              let updatedPresentation: Presentation = selectPresentationById(store.getState(), presentation.id)!;
                              proverService.sendPresentationResponse(updatedPresentation).then(success => {
                                  if (success) {
                                      showGreenSnackBar('Submitted!');
                                      navigation.goBack();
                                  } else {
                                      showRedSnackBar('Failed to submit!');
                                      navigation.goBack();
                                  }
                              });
                          }
                      }}>Submit</Chip>
            </View>
        </>
    );
}
