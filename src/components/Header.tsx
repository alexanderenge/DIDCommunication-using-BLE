import {Button} from "react-native-paper";
import * as React from "react";

export const Header = (props: { title: string, icon?: string, onPress: () => void }): JSX.Element =>
    <Button icon={props.icon} onPress={() => {
        props.onPress()
    }}>{props.title}</Button>
