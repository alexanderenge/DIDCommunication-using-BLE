import * as React from 'react';
import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Avatar, Colors, ProgressBar} from "react-native-paper";

export const ACMDeniedScreen = ({navigation}: { route: any, navigation: any }) => {
    const [progress, setProgress] = useState<number>(1.0)

    useEffect(() => {
        let current: number = 1.0
        let interval = setInterval(() => {
            current -= 0.04
            setProgress(current)
            if (current <= 0.00) {
                clearInterval(interval);
                navigation.goBack()
            }
        }, 200);
        return () => {
            clearInterval(interval);
        };
    }, [])
    return (
        <><View style={styles.container}>
            <Avatar.Icon size={240} color='#FFFFFF' icon="close" style={styles.avatar}/>
            <Text style={styles.text}>Denied</Text>
        </View>
            <ProgressBar progress={progress} color={Colors.grey800} style={styles.progressbar}/>
        </>);
}
const styles = StyleSheet.create({
    avatar: {
        backgroundColor: '#F83434'
    },
    text: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 32
    },
    container: {
        backgroundColor: '#F83434',
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },
    progressbar: {
        height: 16
    }
})
