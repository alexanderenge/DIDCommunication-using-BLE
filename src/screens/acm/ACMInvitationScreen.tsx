import * as React from 'react';
import {InvitationView} from "../../components/InvitationView";

export const ACMInvitationScreen = ({route}: { route: any, navigation: any }) => {
    const invitationId: string = route.params.invitationId;
    return (<InvitationView invitationId={invitationId}/>);
}
