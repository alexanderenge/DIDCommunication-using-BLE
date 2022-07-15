import {createEntityAdapter, createSlice} from '@reduxjs/toolkit'
import {RootState} from "./rootReducer";
import Chat from "../../models/Chat";

export const chatsAdapter = createEntityAdapter<Chat>({selectId: (chat) => chat.id});
export const chatsSlice = createSlice({
    name: 'chats',
    initialState: chatsAdapter.getInitialState(),
    reducers: {
        addChat: chatsAdapter.addOne,
        updateChat: chatsAdapter.updateOne,
        deleteChat: chatsAdapter.removeOne
    }
})

export const {addChat, updateChat, deleteChat} = chatsSlice.actions
export default chatsSlice.reducer

export const {
    selectById: selectChatById,
    selectIds: selectChatIds,
    selectEntities: selectChatEntities,
    selectAll: selectAllChats,
    selectTotal: selectTotalChat
} = chatsAdapter.getSelectors((state: RootState) => state.chats);
