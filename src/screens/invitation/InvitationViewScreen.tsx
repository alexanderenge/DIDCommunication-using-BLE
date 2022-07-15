import * as React from 'react';
import {useLayoutEffect} from 'react';
import {useDispatch} from "react-redux";
import {deleteInvitation} from "../../redux/reducers/invitationSlice";
import {InvitationView} from "../../components/InvitationView";
import {Header} from "../../components/Header";

export const InvitationViewScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const invitationId: string = route.params.invitationId;
    const dispatch = useDispatch();
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Delete" icon="delete-outline" onPress={async () => {
                dispatch(deleteInvitation(invitationId))
                console.log('Deleted successfully')
                navigation.goBack()
            }}/>
        })
    })
    return (<InvitationView invitationId={invitationId}/>)
}
