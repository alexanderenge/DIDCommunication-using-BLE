import * as React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Checkbox} from "react-native-paper";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../redux/reducers/rootReducer";
import {Settings} from "../models/Settings";
import {setSettings} from "../redux/reducers/agentSlice";

export const SettingsScreen = () => {
    const settings: Settings = useSelector((state: RootState) => state.agent.settings)
    const dispatch = useDispatch()
    return (<ScrollView>
        <View style={styles.container}>
            <Checkbox.Item label="Auto accept invitations" labelStyle={{textAlign: 'left'}}
                           position={'leading'}
                           status={settings.autoAcceptInvitations ? 'checked' : 'unchecked'} onPress={() => {
                dispatch(setSettings({
                    ...settings,
                    autoAcceptInvitations: !settings.autoAcceptInvitations
                }))
            }}/>
            <Checkbox.Item label="Allow multiple uses of invitations" labelStyle={{textAlign: 'left'}}
                           position={'leading'}
                           status={settings.allowMulti ? 'checked' : 'unchecked'} onPress={() => {
                dispatch(setSettings({...settings, allowMulti: !settings.allowMulti}))
            }}/>
            <Checkbox.Item label="Allow connection reuses" labelStyle={{textAlign: 'left'}}
                           position={'leading'} status={settings.allowReuses ? 'checked' : 'unchecked'}
                           onPress={() => {
                               dispatch(setSettings({
                                   ...settings,
                                   allowReuses: !settings.allowReuses
                               }))
                           }}/>
            <Checkbox.Item label="Require BLE pairing (need app restart)" labelStyle={{textAlign: 'left'}}
                           position={'leading'}
                           status={settings.requirePairing ? 'checked' : 'unchecked'} onPress={() => {
                dispatch(setSettings({
                    ...settings,
                    requirePairing: !settings.requirePairing
                }))
            }}/>
            <Checkbox.Item label="Disconnect BLE device after sent message" labelStyle={{textAlign: 'left'}}
                           position={'leading'}
                           status={settings.disconnectAfterSentMessage ? 'checked' : 'unchecked'} onPress={() => {
                dispatch(setSettings({
                    ...settings,
                    disconnectAfterSentMessage: !settings.disconnectAfterSentMessage
                }))
            }}/>
        </View>
    </ScrollView>);
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'flex-start'
    },
});
