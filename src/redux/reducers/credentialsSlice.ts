import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import CredentialDetails from "../../models/CredentialDetails";

export const credentialsAdapter = createEntityAdapter<CredentialDetails>();
export const credentialsSlice = createSlice({
    name: 'credentials',
    initialState: credentialsAdapter.getInitialState({
        loading: false
    }),
    reducers: {
        addCredential: credentialsAdapter.addOne,
        updateCredential: credentialsAdapter.updateOne,
        deleteCredential: credentialsAdapter.removeOne
    }
})

export const {addCredential, updateCredential, deleteCredential} = credentialsSlice.actions
export default credentialsSlice.reducer

export const {
    selectById: selectCredentialById,
    selectIds: selectCredentialIds,
    selectEntities: selectCredentialEntities,
    selectAll: selectAllCredentials,
    selectTotal: selectTotalCredential
} = credentialsAdapter.getSelectors((state: RootState) => state.credentials);
