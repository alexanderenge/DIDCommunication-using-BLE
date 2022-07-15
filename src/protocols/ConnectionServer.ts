import Invitation, {InvitationStates} from "../models/Invitation";
import ConnectionDetails, {ConnectionStates} from "../models/ConnectionDetails";
import {ProtocolHandler} from "./MessageHandler";
import {
    connectionToResponse,
    connectionToReuseAccepted,
    createConnection,
    invitationToMessage
} from "../utils/ConnectionUtils";
import store from "../redux/store/Store";
import {selectInvitationById, updateInvitation} from "../redux/reducers/invitationSlice";
import {selectAllConnection, selectConnectionById, updateConnection} from "../redux/reducers/connectionsSlice";
import {setIdentifierDetail} from "../redux/reducers/identifierDetailsSlice";
import MessageDetails from "../models/MessageDetails";
import {showRedSnackBar} from "../utils/Snackbar";
import {connectionServer, messageHandler} from "./Protocols";
import performance from "react-native-performance";

enum ConnectionServerMessageTypes {
    HANDSHAKE_REUSE = 'https://didcomm.org/out-of-band/1.0/handshake-reuse',
    REQUEST = 'https://didcomm.org/didexchange/1.0/request',
    COMPLETE = 'https://didcomm.org/didexchange/1.0/complete'
}

export class ConnectionServer implements ProtocolHandler {
    private readonly onReceiveReuseListener: (connection: ConnectionDetails, reuseMessageId: string) => boolean;
    private readonly onReceiveRequestListener: (connection: ConnectionDetails) => boolean;
    private readonly onReceiveCompleteListener: (connection: ConnectionDetails) => boolean;

    constructor(callback: ConnectionServerCallback) {
        this.onReceiveReuseListener = callback.onReceiveReuse
        this.onReceiveRequestListener = callback.onReceiveRequest
        this.onReceiveCompleteListener = callback.onReceiveComplete
    }

    handleMessage(message: MessageDetails): boolean {
        switch (message.type) {
            case ConnectionServerMessageTypes.HANDSHAKE_REUSE:
                this.handleReceiveReuse(message)
                return true
            case ConnectionServerMessageTypes.REQUEST:
                this.handleReceiveRequest(message)
                return true
            case ConnectionServerMessageTypes.COMPLETE:
                this.handleReceiveComplete(message)
                return true
        }
        return false
    }

    testId: number = 0

    async sendInvitation(invitation: Invitation, toDid?: string): Promise<boolean> {
        this.testId++
        performance.mark('sendInvitationMark:' + this.testId);
        if (invitation.state == InvitationStates.INITIAL) {
            let message: MessageDetails = invitationToMessage(invitation)
            let packedMessage = await messageHandler.sendMessage(message, [toDid], undefined, undefined, {
                success: () => {
                    performance.measure('onSentInvitationMeasure', {start: 'sendInvitationMark:' + this.testId});
                }
            })
            store.dispatch(updateInvitation({
                id: invitation.id,
                changes: {
                    state: InvitationStates.AWAIT_RESPONSE,
                    invitationMessage: packedMessage
                },
            }))
            return true
        } else {
            throw new Error('Must be in state "initial" in order to process this event, current state: ' + invitation.state)
        }
    }

    async sendResponse(connection: ConnectionDetails): Promise<boolean> {
        performance.measure('sendResponseMeasure', {start: 'sendInvitationMark:' + this.testId});
        if (connection.state == ConnectionStates.REQUEST_RECEIVED) {
            let message: MessageDetails | undefined = connectionToResponse(connection)
            if (message) {
                await messageHandler.sendMessage(message, [connection.theirDID], undefined, undefined, {
                    success: () => {
                        performance.measure('onSentResponseMeasure', {start: 'sendInvitationMark:' + this.testId});
                        store.dispatch(updateConnection({
                            id: connection.id,
                            changes: {state: ConnectionStates.RESPONSE_SENT},
                        }))
                    }
                })
                return true
            } else {
                throw new TypeError()
            }
        } else {
            throw new Error('Must be in state "request-received" in order to process this event, current state: ' + connection.state)
        }
    }

    async sendReuseAccepted(connection: ConnectionDetails, reuseMessageId: string): Promise<boolean> {
        performance.measure('sendReuseAcceptedMeasure', {start: 'sendInvitationMark:' + this.testId});
        if (connection.state == ConnectionStates.COMPLETED) {
            let message: MessageDetails = connectionToReuseAccepted(connection, reuseMessageId)
            await messageHandler.sendMessage(message, [connection.theirDID], undefined, undefined, {
                success: () => {
                    performance.measure('onSentReuseAcceptedMeasure', {start: 'sendInvitationMark:' + this.testId});
                    console.log('Connection (' + connection.id + '): Reuse successfully completed between your DID (' + connection.yourDID + ') and their DID (' + connection.theirDID + '), using invitation: ' + connection.invitationId)
                    const invitation: Invitation | undefined = selectInvitationById(store.getState(), connection.invitationId)
                    if (invitation?.onAccepted) {
                        invitation.onAccepted(connection)
                    }
                }
            })
            return true
        } else {
            throw new Error('Must be in state "completed" in order to process this event, current state: ' + connection.state)
        }
    }

    private handleReceiveReuse(message: MessageDetails) {
        performance.measure('handleReceiveReuseMeasure', {start: 'sendInvitationMark:' + this.testId});
        if (message.pthid) {
            const invitation: Invitation | undefined = selectInvitationById(store.getState(), message.pthid) // Lookup invitation
            if (invitation && invitation.state == InvitationStates.AWAIT_RESPONSE) {
                if (!invitation.multi) { // Set to done if single use
                    store.dispatch(updateInvitation({
                        id: invitation.id,
                        changes: {state: InvitationStates.DONE},
                    }))
                }
                // Check if an existing connection can be used
                const existingConnection: ConnectionDetails | undefined = selectAllConnection(store.getState()).filter((connection) => connection.state == ConnectionStates.COMPLETED).find((connection) => {
                    if (message.to === connection.yourDID && message.from === connection.theirDID) {
                        return connection
                    }
                })
                if (existingConnection) {
                    if (existingConnection.state == ConnectionStates.COMPLETED) {
                        store.dispatch(updateConnection({
                            id: existingConnection.id,
                            changes: {invitationId: invitation.id},
                        }))
                        let updatedExistingConnection: ConnectionDetails = selectConnectionById(store.getState(), existingConnection.id)!
                        this.onReceiveReuseListener(updatedExistingConnection, message.id)
                    } else {
                        throw new Error('Must be in state "completed" in order to process this event, current state: ' + existingConnection!.state)
                    }
                } else {
                    throw new Error('Existing connection cannot be found')
                }
            } else {
                throw new Error('Must be in state "await-response" in order to process this event, current state: ' + invitation?.state)
            }
        } else {
            throw new TypeError()
        }
    }

    private handleReceiveRequest(message: MessageDetails) {
        performance.measure('handleReceiveRequestMeasure', {start: 'sendInvitationMark:' + this.testId});
        if (message.pthid && message.thid) {
            const invitation: Invitation | undefined = selectInvitationById(store.getState(), message.pthid)
            if (invitation) {
                if (invitation.state == InvitationStates.AWAIT_RESPONSE) {
                    if (!invitation.multi) { // Set to done if single use
                        store.dispatch(updateInvitation({
                            id: invitation.id,
                            changes: {state: InvitationStates.DONE},
                        }))
                    }
                    let theirDid = message.body.did
                    let theirDidName = message.body.label
                    let theirDidDoc = message.body.did_doc
                    store.dispatch(setIdentifierDetail({ // Add their DID to identifier list
                        did: theirDid,
                        name: theirDidName,
                        provider: '',
                        keys: [],
                        services: theirDidDoc.service,
                        didDocument: theirDidDoc,
                        owned: false
                    }))

                    // Create new connection
                    if (invitation?.connectionDID) {
                        let connection: ConnectionDetails = createConnection({
                            id: message.thid,
                            invitationId: invitation.id,
                            state: ConnectionStates.REQUEST_RECEIVED,
                            theirDID: theirDid,
                            yourDID: invitation.connectionDID

                        })
                        this.onReceiveRequestListener(connection)
                    } else {
                        showRedSnackBar('Connection DID is undefined')
                    }
                } else {
                    throw new Error('Must be in state "await-response" in order to process this event, current state: ' + invitation.state)
                }
            }
        } else {
            throw new TypeError()
        }
    }

    private handleReceiveComplete(message: MessageDetails) {
        performance.measure('handleReceiveCompleteMeasure', {start: 'sendInvitationMark:' + this.testId});
        if (message.thid) {
            const connection: ConnectionDetails | undefined = selectConnectionById(store.getState(), message.thid)
            if (connection) {
                if (connection.state == ConnectionStates.RESPONSE_SENT) {
                    store.dispatch(updateConnection({
                        id: connection.id,
                        changes: {state: ConnectionStates.COMPLETED},
                    }))
                    this.onReceiveCompleteListener(connection)
                } else {
                    throw new Error('Must be in state "response-sent" in order to process this event, current state: ' + connection.state)
                }
            }
        } else {
            throw new TypeError()
        }
    }
}

export class ConnectionServerCallback {

    onReceiveReuse(connection: ConnectionDetails, reuseMessageId: string): boolean {
        console.log('onReceiveReuse: ' + connection.id + ', reuse message Id = ' + reuseMessageId)
        connectionServer.sendReuseAccepted(connection, reuseMessageId).then().catch(reason => showRedSnackBar(reason.message))
        return true
    }

    onReceiveRequest(connection: ConnectionDetails): boolean {
        console.log('onReceiveRequest: ' + connection.id)
        connectionServer.sendResponse(connection).then().catch(reason => showRedSnackBar(reason.message))
        return true
    }

    onReceiveComplete(connection: ConnectionDetails): boolean {
        console.log('onReceiveComplete: ' + connection.id)
        console.log('Connection successfully established between your DID (' + connection.yourDID + ') and their DID (' + connection.theirDID + '), using invitation: ' + connection.invitationId)
        const invitation: Invitation | undefined = selectInvitationById(store.getState(), connection.invitationId)
        if (invitation?.onAccepted) {
            invitation.onAccepted(connection)
        }
        return true
    }
}
