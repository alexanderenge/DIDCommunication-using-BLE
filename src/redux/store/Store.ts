import {configureStore} from '@reduxjs/toolkit'
import {persistReducer,} from 'redux-persist'
import {rootReducer} from "../reducers/rootReducer";
import thunk from "redux-thunk";
import AsyncStorage from "@react-native-async-storage/async-storage";

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer)
export default configureStore({
    reducer: persistedReducer,
    middleware: [thunk]
})
