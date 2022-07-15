import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import ConnectionDetails from "../../models/ConnectionDetails";
import {RootState} from "./rootReducer";

export const connectionsAdapter = createEntityAdapter<ConnectionDetails>();
export const connectionsSlice = createSlice({
    name: 'connections',
    initialState: connectionsAdapter.getInitialState({
        loading: false
    }),
    reducers: {
        addConnection: connectionsAdapter.addOne,
        updateConnection: connectionsAdapter.updateOne,
        deleteConnection: connectionsAdapter.removeOne
    }
})

export const {addConnection, updateConnection, deleteConnection} = connectionsSlice.actions
export default connectionsSlice.reducer

export const {
    selectById: selectConnectionById,
    selectIds: selectConnectionIds,
    selectEntities: selectConnectionEntities,
    selectAll: selectAllConnection,
    selectTotal: selectTotalConnection
} = connectionsAdapter.getSelectors((state: RootState) => state.connections);
