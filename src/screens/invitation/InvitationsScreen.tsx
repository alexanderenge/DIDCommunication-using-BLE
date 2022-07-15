import * as React from 'react';
import {FlatList} from 'react-native';
import {DataTable} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {useSelector} from "react-redux";
import Invitation from "../../models/Invitation";
import {selectAllInvitations} from "../../redux/reducers/invitationSlice";

export const InvitationsScreen = ({navigation}: { navigation: any }) => {
    const invitations: Invitation[] = useSelector(selectAllInvitations)

    const renderItem = ({item}: any) => (
        <DataTable.Row key={item.id}
                       onPress={() => navigation.navigate('InvitationView', {invitationId: item.id})}>
            <DataTable.Cell style={{flex: 3}}>{item.label}</DataTable.Cell>
            <DataTable.Cell style={{flex: 2}}>{item.state}</DataTable.Cell>
        </DataTable.Row>
    );
    return (<SafeAreaView>
        <DataTable>
            <DataTable.Header>
                <DataTable.Title style={{flex: 3}}>Label</DataTable.Title>
                <DataTable.Title style={{flex: 2}}>State</DataTable.Title>
            </DataTable.Header>
            <FlatList
                data={invitations}
                removeClippedSubviews={true}
                renderItem={renderItem}
                keyExtractor={(item, index) => String(index)}>
            </FlatList>
        </DataTable>
    </SafeAreaView>);
};
