import * as React from 'react';
import {PresentationView} from "../../components/PresentationView";
import Presentation, {CandidateCredential} from "../../models/Presentation";
import {useSelector} from "react-redux";
import {RootState} from "../../redux/reducers/rootReducer";
import {selectPresentationById} from "../../redux/reducers/presentationsSlice";
import {findCandidateCredentials, validatePresentationSubmission} from "../../utils/PresentationUtils";
import {Chip, Divider} from "react-native-paper";
import {View} from "react-native";
import {showGreenSnackBar, showRedSnackBar} from "../../utils/Snackbar";
import {VerifiableCredential} from "@veramo/core";
import {selectAllCredentials} from "../../redux/reducers/credentialsSlice";
import store from "../../redux/store/Store";

export const SubmissionViewScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const presentationId: string = route.params.presentationId;
    const presentation: Presentation = useSelector((state: RootState) => selectPresentationById(state, presentationId))!
    const credentials: VerifiableCredential[] = selectAllCredentials(store.getState()).filter((credential) => !credential.issued).map((credential) => credential.verifiableCredential) // Credentials used to see if there is any match against the definition
    const candidateCredentials: CandidateCredential[] = findCandidateCredentials(presentation, credentials)
    return (<>
        <PresentationView navigation={navigation} presentation={presentation}
                          candidateCredentials={candidateCredentials}/>
        <Divider/>
        <View
            style={{margin: 8}}>
            <Chip style={{height: 56, flexGrow: 1, marginRight: 8}} textStyle={{marginLeft: 72}} mode={'outlined'}
                  onPress={async () => {
                      if (presentation) {
                          let isValid = await validatePresentationSubmission(presentation)
                          if (isValid) {
                              showGreenSnackBar('Valid presentation')
                          } else {
                              showRedSnackBar('Invalid presentation')
                          }
                      }
                  }}>Verify presentation submission</Chip>
        </View>
    </>);
}
