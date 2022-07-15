import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import Invitation from "../../models/Invitation";

export const invitationAdapter = createEntityAdapter<Invitation>({selectId: (invitation) => invitation.id,});
export const invitationSlice = createSlice({
    name: 'invitations',
    initialState: invitationAdapter.getInitialState(),
    reducers: {
        addInvitation: invitationAdapter.addOne,
        updateInvitation: invitationAdapter.updateOne,
        deleteInvitation: invitationAdapter.removeOne
    }
})

export const {addInvitation, updateInvitation, deleteInvitation} = invitationSlice.actions
export default invitationSlice.reducer

export const {
    selectById: selectInvitationById,
    selectIds: selectInvitationIds,
    selectEntities: selectInvitationEntities,
    selectAll: selectAllInvitations,
    selectTotal: selectTotalInvitation
} = invitationAdapter.getSelectors((state: RootState) => state.invitations);
