import {ProtocolHandler} from "./MessageHandler";
import MessageDetails from "../models/MessageDetails";
import store from "../redux/store/Store";
import Presentation, {PresentationStates} from "../models/Presentation";
import {presentationToRequest, validatePresentationSubmission} from "../utils/PresentationUtils";
import {selectPresentationById, updatePresentation} from "../redux/reducers/presentationsSlice";
import {PresentationSubmission} from "../models/PresentationSubmission";
import {messageHandler, verifierService} from "./Protocols";
import {VerifiablePresentation} from "@veramo/core";
import {W3CVerifiableCredential} from "@veramo/core/src/types/vc-data-model";
import performance from "react-native-performance";

enum VerifierServiceMessageTypes {
    PRESENTATION = 'https://didcomm.org/present-proof/2.0/presentation'
}

export class VerifierService implements ProtocolHandler {
    private readonly onReceivePresentationListener: (presentation: Presentation) => Promise<boolean>;

    constructor(callback: VerifierCallback) {
        this.onReceivePresentationListener = callback.onReceivePresentation
    }

    handleMessage(message: MessageDetails): boolean {
        if (message.type === VerifierServiceMessageTypes.PRESENTATION) {
            this.handlePresentation(message)
            return true
        }
        return false;
    }

    testId: number = 0

    async sendPresentationRequest(presentation: Presentation): Promise<boolean> {
        this.testId++
        performance.mark('sendPresentationRequestMark:' + this.testId);
        if (presentation.state == PresentationStates.INITIAL) {
            let message: MessageDetails = presentationToRequest(presentation)
            await messageHandler.sendMessage(message, [presentation.connection.theirDID], undefined, undefined, {
                success: () => {
                    performance.measure('onSentPresentationRequestMeasure', {start: 'sendPresentationRequestMark:' + this.testId});
                    store.dispatch(updatePresentation({
                        id: presentation.id,
                        changes: {state: PresentationStates.REQUEST_SENT},
                    }))
                }
            })
            return true
        } else {
            throw new Error('Must be in state "initial" in order to process this event, current state: ' + presentation.state)
        }
    }

    private async handlePresentation(message: MessageDetails) {
        performance.measure('handlePresentationMeasure', {start: 'sendPresentationRequestMark:' + this.testId});
        if (message.thid) {
            const presentation: Presentation | undefined = selectPresentationById(store.getState(), message.thid)
            if (presentation) {
                if (presentation.state == PresentationStates.REQUEST_SENT) {
                    // Validate it here and send response
                    let verifiablePresentation: VerifiablePresentation = message.attachments![0].data?.json
                    let verifiableCredential: W3CVerifiableCredential[] | undefined = verifiablePresentation.verifiableCredential // Credentials used to see if there is any match against the definition
                    let presentationSubmission: PresentationSubmission = verifiablePresentation.presentation_submission
                    store.dispatch(updatePresentation({
                        id: presentation.id,
                        changes: {
                            submission: {
                                presentationSubmission: presentationSubmission,
                                verifiableCredential: verifiableCredential
                            },
                            vp: verifiablePresentation
                        },
                    }))
                    store.dispatch(updatePresentation({
                        id: presentation.id,
                        changes: {state: PresentationStates.DONE},
                    }))
                    let updatedPresentation: Presentation = selectPresentationById(store.getState(), presentation.id)!
                    this.onReceivePresentationListener(updatedPresentation)
                } else {
                    throw new Error('Must be in state "request-sent" in order to process this event, current state: ' + presentation.state)
                }
            } else {
                throw new TypeError()
            }
        } else {
            throw new TypeError()
        }
    }
}

export class VerifierCallback {

    async onReceivePresentation(presentation: Presentation): Promise<boolean> {
        console.log('onReceivePresentation: ' + presentation.id)
        let isValid = await validatePresentationSubmission(presentation)
        if (isValid) {
            if (presentation.onVerified) {
                presentation.onVerified()
            }
        } else {
            if (presentation.onDenied) {
                presentation.onDenied()
            }
        }
        performance.measure('validatedPresentationSubmissionMeasure', {start: 'sendPresentationRequestMark:' + verifierService.testId});
        return true
    }
}
