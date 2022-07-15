import {
    createAgent,
    IDataStore,
    IDataStoreORM,
    IDIDManager,
    IKeyManager,
    IMessageHandler,
    IResolver
} from '@veramo/core'
import {MessageHandler} from '@veramo/message-handler'
import {DIDManager} from '@veramo/did-manager'
import {KeyManagementSystem, SecretBox} from '@veramo/kms-local'
import {DIDResolverPlugin} from '@veramo/did-resolver'
import {Resolver} from 'did-resolver'
import {getResolver as ethrDidResolver} from 'ethr-did-resolver'
import {getResolver as webDidResolver} from 'web-did-resolver'
import {DataStore, DataStoreORM, DIDStore, Entities, KeyStore, migrations, PrivateKeyStore} from '@veramo/data-store'
import {createConnection} from 'typeorm'
import {CredentialIssuer, ICredentialIssuer, W3cMessageHandler} from '@veramo/credential-w3c'
import {WebDIDProvider} from '@veramo/did-provider-web'
import {JwtMessageHandler} from '@veramo/did-jwt'
import {KeyManager} from "@veramo/key-manager";
import {getDidKeyResolver, KeyDIDProvider} from "@veramo/did-provider-key";
import {contexts as credential_contexts} from '@transmute/credentials-context'
import {DIDComm, DIDCommHttpTransport, DIDCommMessageHandler, IDIDComm} from "@veramo/did-comm";
import {
    CredentialIssuerLD,
    ICredentialIssuerLD,
    LdDefaultContexts,
    VeramoEcdsaSecp256k1RecoverySignature2020,
    VeramoEd25519Signature2018
} from "@veramo/credential-ld";

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = '<your PROJECT_ID here>'

// This is a raw X25519 private key, provided as an example.
// You can run `veramo config create-secret-key` in a terminal to generate a new key.
// In a production app, this MUST NOT be hardcoded in your source code.
const dbEncryptionKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'

// Create react native db connection
const dbConnection = createConnection({
    type: 'react-native',
    database: 'veramo.sqlite',
    location: 'default',
    migrations: migrations,
    migrationsRun: true,
    logging: ['error', 'info', 'warn'],
    entities: Entities,
})

export const agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialIssuer & IMessageHandler & IDIDComm & ICredentialIssuerLD>({
    plugins: [
        new KeyManager({
            store: new KeyStore(dbConnection),
            kms: {
                local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(dbEncryptionKey))),
            },
        }),
        new DIDManager({
            store: new DIDStore(dbConnection),
            defaultProvider: 'did:key',
            providers: {
                'did:key': new KeyDIDProvider({
                    defaultKms: 'local',
                }),
                'did:web': new WebDIDProvider({
                    defaultKms: 'local',
                }),
            },
        }),
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new CredentialIssuer(),
        new CredentialIssuerLD({
            contextMaps: [LdDefaultContexts, credential_contexts as any,
                new Map([['https://example.com/contexts/acvc/v1', require('./contexts/acvc-v1.json')],
                    ['https://identity.foundation/presentation-exchange/submission/v1', require('./contexts/submission-v1.json')]])],
            suites: [
                new VeramoEcdsaSecp256k1RecoverySignature2020(),
                new VeramoEd25519Signature2018(),
            ],
        }),
        new DIDComm([new DIDCommHttpTransport()]),
        new MessageHandler({
            messageHandlers: [
                new DIDCommMessageHandler(),
                new JwtMessageHandler(),
                new W3cMessageHandler(),
            ],
        }),
        new DIDResolverPlugin({
            resolver: new Resolver({
                ...ethrDidResolver({infuraProjectId: INFURA_PROJECT_ID}),
                ...getDidKeyResolver(),
                ...webDidResolver(),
            }),
        }),
    ],
})
