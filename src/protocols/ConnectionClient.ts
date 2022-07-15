import Invitation, {InvitationStates} from "../models/Invitation";
import ConnectionDetails, {ConnectionStates} from "../models/ConnectionDetails";
import {ProtocolHandler} from "./MessageHandler";
import {
    connectionToComplete,
    connectionToRequest,
    connectionToReuse,
    respondToInvitation,
    saveInvitation
} from "../utils/ConnectionUtils";
import store from "../redux/store/Store";
import {selectInvitationById, updateInvitation} from "../redux/reducers/invitationSlice";
import {selectAllConnection, selectConnectionById, updateConnection} from "../redux/reducers/connectionsSlice";
import {setIdentifierDetail} from "../redux/reducers/identifierDetailsSlice";
import MessageDetails from "../models/MessageDetails";
import {Alert} from "react-native";
import {connectionClient, messageHandler} from "./Protocols";
import {getSettings} from "../utils/AgentUtils";
import performance from "react-native-performance";
import {showGreenSnackBar, showRedSnackBar} from "../utils/Snackbar";
import {IPackedDIDCommMessage} from "@veramo/did-comm";

enum ConnectionClientMessageTypes {
    INVITATION = 'https://didcomm.org/out-of-band/1.0/invitation',
    HANDSHAKE_REUSE_ACCEPTED = 'https://didcomm.org/out-of-band/1.0/handshake-reuse-accepted',
    RESPONSE = 'https://didcomm.org/didexchange/1.0/response'
}

export class ConnectionClient implements ProtocolHandler {
    private readonly onReceiveInvitationListener: (invitation: Invitation) => boolean;
    private readonly onReceiveReuseAcceptedListener: (connection: ConnectionDetails) => boolean;
    private readonly onReceiveResponseListener: (connection: ConnectionDetails) => boolean;

    constructor(callback: ConnectionClientCallbacks) {
        this.onReceiveInvitationListener = callback.onReceiveInvitation
        this.onReceiveReuseAcceptedListener = callback.onReceiveReuseAccepted
        this.onReceiveResponseListener = callback.onReceiveResponse
    }

    handleMessage(message: MessageDetails): boolean {
        switch (message.type) {
            case ConnectionClientMessageTypes.INVITATION:
                this.handleReceiveInvitation(message)
                return true
            case ConnectionClientMessageTypes.HANDSHAKE_REUSE_ACCEPTED:
                this.handleReceiveReuseAccepted(message)
                return true
            case ConnectionClientMessageTypes.RESPONSE:
                this.handleReceiveResponse(message)
                return true
        }
        return false
    }

    testId: number = 0

    async sendRequest(connection: ConnectionDetails): Promise<boolean> {
        performance.measure('sendRequestMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
        if (connection.state == ConnectionStates.INVITATION_RECEIVED) {
            const invitation: Invitation | undefined = selectInvitationById(store.getState(), connection.invitationId)
            const message: MessageDetails | undefined = connectionToRequest(connection)
            if (invitation && message) {
                await messageHandler.sendMessage(message, invitation?.serviceEndpoints, undefined, undefined, {
                    success: () => {
                        performance.measure('onSentRequestMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
                        store.dispatch(updateInvitation({
                            id: connection.invitationId,
                            changes: {state: InvitationStates.DONE},
                        }))
                        store.dispatch(updateConnection({
                            id: connection.id,
                            changes: {state: ConnectionStates.REQUEST_SENT},
                        }))
                    }
                })
                return true
            } else {
                throw new TypeError();
            }
        } else {
            throw new Error('Must be in state "invitation-received" in order to process this event, current state: ' + connection.state)
        }
    }

    async sendComplete(connection: ConnectionDetails): Promise<boolean> {
        performance.measure('sendCompleteMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
        if (connection.state == ConnectionStates.RESPONSE_RECEIVED) {
            const message: MessageDetails = connectionToComplete(connection)
            await messageHandler.sendMessage(message, [connection.theirDID], undefined, undefined, {
                success: () => {
                    performance.measure('onSentCompleteMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
                    store.dispatch(updateConnection({
                        id: connection.id,
                        changes: {state: ConnectionStates.COMPLETED},
                    }))
                    console.log('Connection successfully established between your DID (' + connection.yourDID + ') and their DID (' + connection.theirDID + '), using invitation: ' + connection.invitationId)
                    const invitation: Invitation | undefined = selectInvitationById(store.getState(), connection.invitationId)
                    if (invitation?.onAccepted) {
                        invitation.onAccepted(connection)
                    }
                }
            })
            return true
        } else {
            throw new Error('Must be in state "response-received" in order to process this event, current state: ' + connection.state)
        }
    }

    async sendReuse(connection: ConnectionDetails): Promise<boolean> {
        performance.measure('sendReuseMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
        if (connection.state == ConnectionStates.COMPLETED) {
            const message: MessageDetails = connectionToReuse(connection)
            await messageHandler.sendMessage(message, [connection.theirDID], undefined, undefined, {
                success: () => {
                    performance.measure('onSentReuseMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
                    console.log('Connection (' + connection.id + '): Reuse is sent for your DID (' + connection.yourDID + ') and their DID (' + connection.theirDID + '), using invitation: ' + connection.invitationId)
                }
            })
            return true
        } else {
            throw new Error('Must be in state "completed" in order to process this event, current state: ' + connection.state)
        }
    }

    private handleReceiveInvitation(message: MessageDetails) {
        this.testId++
        performance.mark('handleReceiveInvitationMark:' + this.testId);
        let packedMessage: IPackedDIDCommMessage = {message: JSON.stringify(message)}
        let invitation: Invitation | undefined = saveInvitation({
            id: message.id,
            state: InvitationStates.PREPARE_RESPONSE,
            from: message.from,
            goal: message.body?.goal,
            goalCode: message.body?.goal_code,
            label: message.body?.label,
            invitationMessage: packedMessage,
            serviceEndpoints: message.body.services as Array<any>,
            onAccepted: async () => {
                console.log('Invitation (' + invitation?.id + '): Successfully completed')
                showGreenSnackBar('Invitation (' + invitation?.id + '): Successfully completed')
            }
        })
        if (invitation) {
            this.onReceiveInvitationListener(invitation)
        }
    }

    private handleReceiveReuseAccepted(message: MessageDetails) {
        performance.measure('handleReceiveReuseAcceptedMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
        if (message.pthid) {
            // Check if an existing connection can be used
            const existingConnection: ConnectionDetails | undefined = selectAllConnection(store.getState()).filter((connection) => connection.state == ConnectionStates.COMPLETED).find((connection) => {
                if (message.to === connection.yourDID && message.from === connection.theirDID && connection.invitationId === message.pthid) {
                    return connection
                }
            })
            if (existingConnection) {
                if (existingConnection.state == ConnectionStates.COMPLETED) {
                    this.onReceiveReuseAcceptedListener(existingConnection)
                } else {
                    throw new Error('Must be in state "completed" in order to process this event, current state: ' + existingConnection.state)
                }
            }
        } else {
            throw new TypeError()
        }
    }

    private handleReceiveResponse(message: MessageDetails) {
        performance.measure('handleReceiveResponseMeasure', {start: 'handleReceiveInvitationMark:' + this.testId});
        if (message.thid) {
            let connection: ConnectionDetails | undefined = selectConnectionById(store.getState(), message.thid)
            if (connection) {
                if (connection.state == ConnectionStates.REQUEST_SENT) {
                    let theirDid = message.body.did
                    let theirDidName = message.body.label
                    let theirDidDoc = message.body.did_doc
                    store.dispatch(setIdentifierDetail({
                        did: theirDid,
                        name: theirDidName,
                        provider: '',
                        keys: [],
                        services: theirDidDoc.service,
                        didDocument: theirDidDoc,
                        owned: false
                    }))
                    store.dispatch(updateConnection({
                        id: connection.id,
                        changes: {
                            state: ConnectionStates.RESPONSE_RECEIVED,
                            theirDID: theirDid,
                        },
                    }))
                    let updatedConnection: ConnectionDetails | undefined = selectConnectionById(store.getState(), connection.id)
                    if (updatedConnection) {
                        this.onReceiveResponseListener(updatedConnection)
                    } else {
                        throw new TypeError()
                    }
                } else {
                    throw new Error('Must be in state "request-sent" in order to process this event, current state: ' + connection.state)
                }
            }
        } else {
            throw new TypeError()
        }
    }
}

export class ConnectionClientCallbacks {

    onReceiveInvitation(invitation: Invitation): boolean {
        console.log('onReceiveInvitation: ' + invitation.id)
        if (getSettings().autoAcceptInvitations) {
            respondToInvitation(invitation).then().catch(reason => showRedSnackBar(reason.message))
        } else {
            Alert.alert(
                "Do you accept this invitation?",
                "From host: " + invitation.serviceEndpoints[0].serviceEndpoint + '\nGoal: ' + invitation.goalCode,
                [
                    {
                        text: "Cancel",
                        onPress: () => console.log("Cancel pressed"),
                        style: "cancel"
                    },
                    {
                        text: "Accept", onPress: () => {
                            console.log("Accept pressed")
                            respondToInvitation(invitation).then().catch(reason => showRedSnackBar(reason.message))
                        }
                    }
                ]
            );
        }
        return true
    }

    onReceiveReuseAccepted(connection: ConnectionDetails): boolean {
        console.log('onReceiveReuseAccepted: ' + connection.id)
        console.log('Connection (' + connection.id + '): Reuse successfully completed between your DID (' + connection.yourDID + ') and their DID (' + connection.theirDID + '), using invitation: ' + connection.invitationId)
        const invitation: Invitation | undefined = selectInvitationById(store.getState(), connection.invitationId)
        if (invitation?.onAccepted) {
            invitation.onAccepted(connection)
        }
        return true
    }

    onReceiveResponse(connection: ConnectionDetails): boolean {
        console.log('onReceiveResponse: ' + connection.id)
        connectionClient.sendComplete(connection).then().catch(reason => showRedSnackBar(reason.message))
        return true
    }

}
