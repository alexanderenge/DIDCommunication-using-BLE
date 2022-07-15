import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import IdentifierDetails from "../../models/IdentifierDetails";

export const identifierDetailsAdapter = createEntityAdapter<IdentifierDetails>({selectId: (identifierDetails) => identifierDetails.did,});
export const identifierDetailsSlice = createSlice({
    name: 'identifiers',
    initialState: identifierDetailsAdapter.getInitialState(),
    reducers: {
        addIdentifierDetail: identifierDetailsAdapter.addOne,
        setIdentifierDetail: identifierDetailsAdapter.setOne,
        updateIdentifierDetail: identifierDetailsAdapter.updateOne,
        deleteIdentifierDetail: identifierDetailsAdapter.removeOne
    }
})

export const {
    addIdentifierDetail,
    setIdentifierDetail,
    updateIdentifierDetail,
    deleteIdentifierDetail
} = identifierDetailsSlice.actions
export default identifierDetailsSlice.reducer

export const {
    selectById: selectIdentifierDetailById,
    selectIds: selectIdentifierDetailIds,
    selectEntities: selectIdentifierDetailEntities,
    selectAll: selectAllIdentifierDetails,
    selectTotal: selectTotalIdentifierDetail
} = identifierDetailsAdapter.getSelectors((state: RootState) => state.identifierDetails);
