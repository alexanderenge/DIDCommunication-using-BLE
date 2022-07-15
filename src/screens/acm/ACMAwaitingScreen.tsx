import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ActivityIndicator} from "react-native-paper";

export const ACMAwaitingScreen = () => {
    return (
        <><View style={styles.container}>
            <ActivityIndicator style={{margin: 32}} animating={true} size={240} color='#FFFFFF'/>
            <Text style={styles.text}>Awaiting proof ...</Text>
        </View>
        </>);
}

const styles = StyleSheet.create({
    text: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 32
    },
    container: {
        backgroundColor: '#FFC107',
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },
})
