import {combineReducers} from 'redux'
import connectionsSlice from "./connectionsSlice";
import agentSlice from "./agentSlice";
import identifierDetailsSlice from "./identifierDetailsSlice";
import chatsSlice from "./chatsSlice";
import invitationSlice from "./invitationSlice";
import credentialsSlice from "./credentialsSlice";
import presentationsSlice from "./presentationsSlice";
import definitionsSlice from "./DefinitionsSlice";
import SchemasSlice from "./SchemasSlice";

export const rootReducer = combineReducers({
    agent: agentSlice,
    identifierDetails: identifierDetailsSlice,
    chats: chatsSlice,
    connections: connectionsSlice,
    invitations: invitationSlice,
    credentials: credentialsSlice,
    presentations: presentationsSlice,
    schemas: SchemasSlice,
    definitions: definitionsSlice
})

export type RootState = ReturnType<typeof rootReducer>
