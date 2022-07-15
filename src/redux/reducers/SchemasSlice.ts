import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import Schema from "../../models/Schema";

export const schemasAdapter = createEntityAdapter<Schema>();
export const schemasSlice = createSlice({
    name: 'schemas',
    initialState: schemasAdapter.getInitialState({
        loading: false
    }),
    reducers: {
        addSchema: schemasAdapter.addOne,
        updateSchema: schemasAdapter.updateOne,
        deleteSchema: schemasAdapter.removeOne
    }
})

export const {addSchema, updateSchema, deleteSchema} = schemasSlice.actions
export default schemasSlice.reducer

export const {
    selectById: selectSchemaById,
    selectIds: selectSchemaIds,
    selectEntities: selectSchemaEntities,
    selectAll: selectAllSchemas,
    selectTotal: selectTotalSchema
} = schemasAdapter.getSelectors((state: RootState) => state.schemas);
