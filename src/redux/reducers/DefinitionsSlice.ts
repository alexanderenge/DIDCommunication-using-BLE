import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import {PresentationDefinition} from "../../models/PresentationDefinition";

export const definitionsAdapter = createEntityAdapter<PresentationDefinition>();
export const definitionsSlice = createSlice({
    name: 'definitions',
    initialState: definitionsAdapter.getInitialState({
        loading: false
    }),
    reducers: {
        addDefinition: definitionsAdapter.addOne,
        updateDefinition: definitionsAdapter.updateOne,
        deleteDefinition: definitionsAdapter.removeOne
    }
})

export const {addDefinition, updateDefinition, deleteDefinition} = definitionsSlice.actions
export default definitionsSlice.reducer

export const {
    selectById: selectDefinitionById,
    selectIds: selectDefinitionIds,
    selectEntities: selectDefinitionEntities,
    selectAll: selectAllDefinitions,
    selectTotal: selectTotalDefinition
} = definitionsAdapter.getSelectors((state: RootState) => state.definitions);
