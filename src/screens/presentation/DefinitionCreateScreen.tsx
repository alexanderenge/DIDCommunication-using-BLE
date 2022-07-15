import * as React from 'react';
import {useEffect, useLayoutEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Chip, Dialog, Portal, Text, TextInput} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {v4 as uuidv4} from "uuid";
import {useDispatch, useSelector} from "react-redux";
import {addDefinition} from "../../redux/reducers/DefinitionsSlice";
import {ConstraintField, InputDescriptor, PresentationDefinition} from "../../models/PresentationDefinition";
import {showGreenSnackBar, showSnackBar} from "../../utils/Snackbar";
import DropDown from "react-native-paper-dropdown";
import {selectAllIdentifierDetails} from "../../redux/reducers/identifierDetailsSlice";
import {selectAllSchemas, selectSchemaById} from "../../redux/reducers/SchemasSlice";
import store from "../../redux/store/Store";
import Schema from "../../models/Schema";
import {Header} from "../../components/Header";

export const DefinitionCreateScreen = ({route, navigation}: { route: any, navigation: any }) => {
    const schemaId: string = route.params?.schemaId;
    const [name, setName] = React.useState("");
    const [purpose, setPurpose] = React.useState("");
    const [descriptorName, setDescriptorName] = React.useState("");
    const [descriptorPurpose, setDescriptorPurpose] = React.useState("");
    const [constraintFields, setConstraintFields] = React.useState<ConstraintField[]>([]);

    const [typeFilter, setTypeFilter] = React.useState("");
    const [schemaFilter, setSchemaFilter] = React.useState<string>("");
    const [issuerFilter, setIssuerFilter] = React.useState<string>('');

    const possibleSchemas: { label: string, value: string }[] = useSelector(selectAllSchemas).map((possibleSchema) => {
        return {
            label: possibleSchema.name!,
            value: possibleSchema.id!
        }
    })
    const possibleIssuers: { label: string, value: string }[] = useSelector(selectAllIdentifierDetails).filter((detail) => detail.owned).map((possibleIssuer) => {
        return {
            label: possibleIssuer.did,
            value: possibleIssuer.did
        }
    })
    const [visible, setVisible] = React.useState(false);
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);
    let dispatch = useDispatch()
    useEffect(() => {
        if (schemaId) {
            let schema: Schema = selectSchemaById(store.getState(), schemaId)!
            let pathPath = 'credentialSchema.id'
            let constraintField: ConstraintField = {
                filter: {
                    "type": "string",
                    "pattern": schema.id
                },
                path: ['$.' + pathPath],
                purpose: 'Get schema with matching id'
            }
            let fieldArray = [...constraintFields]
            fieldArray.push(constraintField)
            setName(schema.name + ' Definition')
            setDescriptorName(schema.name + ' Descriptor')
            setDescriptorPurpose(schema.description)
            setConstraintFields(fieldArray)
        }
    }, [])
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Header title="Save" onPress={async () => {
                let inputDescriptor: InputDescriptor = {
                    id: uuidv4(),
                    name: descriptorName,
                    purpose: descriptorPurpose,
                    constraints: {fields: constraintFields},
                }
                let definition: PresentationDefinition = {
                    id: uuidv4(),
                    name: name,
                    purpose: purpose,
                    input_descriptors: [inputDescriptor]
                }
                dispatch(addDefinition(definition))
                console.log('Saved definition: ' + JSON.stringify(definition))
                showGreenSnackBar('Saved definition')
                navigation.goBack()
            }}/>
        })
    })
    const getFilter = (path: string) => {
        switch (path) {
            case 'type':
                return {
                    "type": [
                        "string",
                        "array"
                    ],
                    "contains": {
                        "type": "string",
                        "pattern": typeFilter
                    },
                    "pattern": typeFilter
                }
            case 'credentialSchema.id':
                return {
                    "type": "string",
                    "pattern": schemaFilter
                }
            case 'issuer':
                return {
                    "type": "string",
                    "pattern": issuerFilter
                }
            case 'credentialSubject':
                return {}
            default:
                return {}
        }
    }
    const AddConstraintFieldDialog = () => {
        const [selectedPath, setSelectedPath] = React.useState('');
        const [fieldPurpose, setFieldPurpose] = React.useState("");

        const isSelected = (path: string) => selectedPath == path
        const DisplayFilter = () => {
            const [showDropDownSchema, setShowDropDownSchema] = useState(false);
            const [showDropDownIssuer, setShowDropDownIssuer] = useState(false);
            switch (selectedPath) {
                case 'type':
                    return (<TextInput
                        style={styles.inputfield}
                        mode={'outlined'}
                        label="Type name"
                        value={typeFilter}
                        onChangeText={text => setTypeFilter(text)}
                    />)
                case 'credentialSchema.id':
                    return (<DropDown
                        label={"Select required schema"}
                        mode={"outlined"}
                        visible={showDropDownSchema}
                        showDropDown={() => setShowDropDownSchema(true)}
                        onDismiss={() => setShowDropDownSchema(false)}
                        value={schemaFilter}
                        setValue={setSchemaFilter}
                        list={possibleSchemas}
                    />)
                case 'issuer':
                    return (<DropDown
                        label={"Select required issuer"}
                        mode={"outlined"}
                        visible={showDropDownIssuer}
                        showDropDown={() => setShowDropDownIssuer(true)}
                        onDismiss={() => setShowDropDownIssuer(false)}
                        value={issuerFilter}
                        setValue={setIssuerFilter}
                        list={possibleIssuers}
                    />)
                case 'credentialSubject':
                    return (<Text>credentialSubject is not implemented yet</Text>)
                default:
                    return (<Text>None selected yet</Text>)
            }
        }
        return (
            <View>
                <Portal>
                    <Dialog visible={visible} onDismiss={hideDialog}>
                        <Dialog.Title>Add constraint field</Dialog.Title>
                        <Dialog.Content style={{flexDirection: 'column'}}>
                            <TextInput
                                style={styles.inputfield}
                                mode={'outlined'}
                                label="Field purpose (optional)"
                                value={fieldPurpose}
                                onChangeText={text => setFieldPurpose(text)}
                            />
                            <Text>Choose a predefined path for this field</Text>
                            <View style={{flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                                <Chip selected={isSelected('type')} onPress={() => setSelectedPath('type')}
                                      style={styles.chip}>Type</Chip>
                                <Chip selected={isSelected('credentialSchema.id')}
                                      onPress={() => setSelectedPath('credentialSchema.id')}
                                      style={styles.chip}>Schema</Chip>
                                <Chip selected={isSelected('issuer')} onPress={() => setSelectedPath('issuer')}
                                      style={styles.chip}>Issuer</Chip>
                                <Chip selected={isSelected('credentialSubject')}
                                      onPress={() => setSelectedPath('credentialSubject')}
                                      style={styles.chip}>Subject</Chip>
                            </View>
                            <DisplayFilter/>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => {
                                hideDialog()
                            }}>Cancel</Button>
                            <Button disabled={!selectedPath} onPress={() => {
                                let constraintField: ConstraintField = {
                                    filter: getFilter(selectedPath),
                                    path: ['$.' + selectedPath],
                                    purpose: fieldPurpose
                                }
                                let fieldArray = [...constraintFields]
                                fieldArray.push(constraintField)
                                setConstraintFields(fieldArray)
                                hideDialog()
                            }}>Add</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        );
    };
    return (<SafeAreaView>
        <AddConstraintFieldDialog/>
        <ScrollView>
            <View style={styles.container}>
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    label="Definition name"
                    value={name}
                    onChangeText={text => setName(text)}
                />
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    label="Definition purpose (optional)"
                    value={purpose}
                    onChangeText={text => setPurpose(text)}
                />
                <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                    <Text>Input descriptor (1/1)</Text>
                    <Chip icon="plus-circle-outline" onPress={() => {
                        showSnackBar('Only 1 descriptor is currently supported')
                    }}>Add descriptor</Chip>
                </View>
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    label="Descriptor name (optional)"
                    value={descriptorName}
                    onChangeText={text => setDescriptorName(text)}
                />
                <TextInput
                    style={styles.inputfield}
                    mode={'outlined'}
                    label="Descriptor purpose (optional)"
                    value={descriptorPurpose}
                    onChangeText={text => setDescriptorPurpose(text)}
                />
                <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                    <Text>Input descriptor fields</Text>
                    <Chip icon="plus-circle-outline" onPress={() => {
                        showDialog()
                    }}>Add constraint field</Chip>
                </View>
                {constraintFields.map((constraintField, index) => {
                    return (
                        <Chip style={{height: 56, marginTop: 8}} icon="label-outline"
                              onPress={() => console.log(JSON.stringify(constraintField))} onClose={() => {
                            let updatedFields = [...constraintFields]
                            updatedFields.splice(index, 1);
                            setConstraintFields(updatedFields)
                        }}>{constraintField.purpose}</Chip>
                    )

                })}
            </View>
        </ScrollView>
    </SafeAreaView>);
}

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    inputfield: {
        marginBottom: 8
    },
    chip: {
        marginTop: 4,
        marginBottom: 4,
        marginRight: 4,
        height: 32
    }
});
