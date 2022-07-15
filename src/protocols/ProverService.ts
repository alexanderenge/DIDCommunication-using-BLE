import {ProtocolHandler} from "./MessageHandler";
import MessageDetails from "../models/MessageDetails";
import Presentation, {CandidateCredential, PresentationStates} from "../models/Presentation";
import store from "../redux/store/Store";
import {selectPresentationById, updatePresentation} from "../redux/reducers/presentationsSlice";
import ConnectionDetails from "../models/ConnectionDetails";
import {
    createPresentation,
    findCandidateCredentials,
    generatePresentationSubmission,
    presentationToResponse
} from "../utils/PresentationUtils";
import {getConnection} from "../utils/ChatUtils";
import {navigate} from "../navigation/StackNavigator";
import {messageHandler, proverService} from "./Protocols";
import performance from "react-native-performance";
import {isTesting} from "../utils/AgentUtils";
import {GeneratedPresentationSubmission} from "../models/PresentationSubmission";
import {showGreenSnackBar, showRedSnackBar} from "../utils/Snackbar";
import {selectAllCredentials} from "../redux/reducers/credentialsSlice";
import {VerifiableCredential} from "@veramo/core";

enum ProverServiceMessageTypes {
    REQUEST_PRESENTATION = 'https://didcomm.org/present-proof/2.0/request-presentation'
}

export class ProverService implements ProtocolHandler {
    private readonly onReceiveRequestPresentationListener: (presentation: Presentation) => boolean;

    constructor(callback: ProverCallback) {
        this.onReceiveRequestPresentationListener = callback.onReceiveRequestPresentation
    }

    handleMessage(message: MessageDetails): boolean {
        switch (message.type) {
            case ProverServiceMessageTypes.REQUEST_PRESENTATION:
                this.handlePresentationRequest(message)
                return true
        }
        return false;
    }

    testId: number = 0

    async sendPresentationResponse(presentation: Presentation): Promise<boolean> {
        performance.measure('sendPresentationResponseMeasure', {start: 'handlePresentationRequestMark:' + this.testId});
        if (presentation.state == PresentationStates.REQUEST_RECEIVED) {
            let message = await presentationToResponse(presentation)
            await messageHandler.sendMessage(message, [presentation.connection.theirDID], undefined, undefined, {
                success: () => {
                    performance.measure('onSentPresentationResponseMeasure', {start: 'handlePresentationRequestMark:' + this.testId});
                    store.dispatch(updatePresentation({
                        id: presentation.id,
                        changes: {state: PresentationStates.DONE, vp: message.attachments![0].data.json},
                    }))
                }
            })
            return true
        } else {
            throw new Error('Must be in state "request-received" in order to process this event, current state: ' + presentation.state)
        }
    }

    private handlePresentationRequest(message: MessageDetails) {
        this.testId++
        performance.mark('handlePresentationRequestMark:' + this.testId);
        if (message.to && message.from) {
            let connection: ConnectionDetails | undefined = getConnection(message.to, message.from)
            if (connection) {
                let presentation_definition = message.attachments![0].data?.json?.presentation_definition
                let presentation: Presentation = createPresentation(presentation_definition, connection, {
                    presentationId: message.id,
                    presentationState: PresentationStates.REQUEST_RECEIVED
                })
                this.onReceiveRequestPresentationListener(presentation)
            } else {
                throw new TypeError()
            }
        } else {
            throw new TypeError()
        }
    }
}

export class ProverCallback {
    onReceiveRequestPresentation(presentation: Presentation): boolean {
        console.log('onReceiveRequestPresentation: ' + presentation.id)
        if (isTesting()) {
            const credentials: VerifiableCredential[] = selectAllCredentials(store.getState()).filter((credential) => !credential.issued).map((credential) => credential.verifiableCredential) // Credentials used to see if there is any match against the definition
            const candidateCredentials: CandidateCredential[] = findCandidateCredentials(presentation, credentials)
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
                    } else {
                        showRedSnackBar('Failed to submit!');
                    }
                });
            }
        } else { // Open presentation confirm screen
            navigate('PresentationConfirm', {
                presentationId: presentation.id
            })
        }
        return true
    }
}
