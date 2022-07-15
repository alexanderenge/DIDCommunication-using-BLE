import {createSlice} from '@reduxjs/toolkit'
import {v4 as uuidv4} from "uuid";
import {Settings} from "../../models/Settings";

const initialSettings: Settings = {
    allowMulti: false,
    allowReuses: false,
    autoAcceptInvitations: false,
    requirePairing: false,
    disconnectAfterSentMessage: false
}
export const agentSlice = createSlice({
    name: 'agent',
    initialState: {
        defaultIdentifier: '',
        bluetoothServiceEndpoint: 'ble/' + uuidv4(),
        isTesting: false,
        settings: initialSettings
    },
    reducers: {
        setDefaultIdentifer: (state, action) => {
            state.defaultIdentifier = action.payload
        },
        setBluetoothServiceEndpoint: (state, action) => {
            state.bluetoothServiceEndpoint = action.payload
        },
        setIsTesting: (state, action) => {
            state.isTesting = action.payload
        },
        setSettings: (state, action) => {
            state.settings = action.payload
        },
    }
})

// Action creators are generated for each case reducer function
export const {
    setDefaultIdentifer,
    setBluetoothServiceEndpoint,
    setIsTesting,
    setSettings
} = agentSlice.actions

export default agentSlice.reducer
