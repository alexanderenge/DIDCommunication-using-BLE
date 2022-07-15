import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import Presentation from "../../models/Presentation";

export const presentationsAdapter = createEntityAdapter<Presentation>();
export const presentationsSlice = createSlice({
    name: 'presentations',
    initialState: presentationsAdapter.getInitialState({
        loading: false
    }),
    reducers: {
        addPresentation: presentationsAdapter.addOne,
        updatePresentation: presentationsAdapter.updateOne,
        deletePresentation: presentationsAdapter.removeOne
    }
})

export const {addPresentation, updatePresentation, deletePresentation} = presentationsSlice.actions
export default presentationsSlice.reducer

export const {
    selectById: selectPresentationById,
    selectIds: selectPresentationIds,
    selectEntities: selectPresentationEntities,
    selectAll: selectAllPresentations,
    selectTotal: selectTotalPresentation
} = presentationsAdapter.getSelectors((state: RootState) => state.presentations);
