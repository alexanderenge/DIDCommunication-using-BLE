import {createConnection} from "typeorm";
import {DataStore, DataStoreORM, DIDStore, Entities, KeyStore, migrations, PrivateKeyStore} from "@veramo/data-store";
import {
    createAgent,
    IDataStore,
    IDataStoreORM,
    IDIDManager,
    IKeyManager,
    IMessageHandler,
    IResolver
} from "@veramo/core";
import {CredentialIssuer, ICredentialIssuer, W3cMessageHandler} from "@veramo/credential-w3c";
import {KeyManager} from "@veramo/key-manager";
import {KeyManagementSystem, SecretBox} from "@veramo/kms-local";
import {DIDManager} from "@veramo/did-manager";
import {getDidKeyResolver, KeyDIDProvider} from "@veramo/did-provider-key";
import {WebDIDProvider} from "@veramo/did-provider-web";
import {MessageHandler} from "@veramo/message-handler";
import {JwtMessageHandler} from "@veramo/did-jwt";
import {DIDResolverPlugin} from "@veramo/did-resolver";
import {Resolver} from "did-resolver";
import {getResolver as webDidResolver} from "web-did-resolver";
import {contexts as credential_contexts} from "@transmute/credentials-context";
import {DIDComm, DIDCommHttpTransport, DIDCommMessageHandler, IDIDComm} from "@veramo/did-comm";
import {
    CredentialIssuerLD,
    ICredentialIssuerLD,
    LdDefaultContexts,
    VeramoEcdsaSecp256k1RecoverySignature2020,
    VeramoEd25519Signature2018
} from "@veramo/credential-ld";

const dbEncryptionKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'

const DATABASE_FILE = './database.sqlite' // This will be the name for the local sqlite database
const testDbConnection = createConnection({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: false,     // set this to false
    migrations: migrations, // import the default migrations from veramo
    migrationsRun: true,    // enable this flag
    logging: false,
    entities: Entities,
})
export let testAgent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialIssuer & IMessageHandler & IDIDComm & ICredentialIssuerLD>({
    plugins: [
        new KeyManager({
            store: new KeyStore(testDbConnection),
            kms: {
                local: new KeyManagementSystem(new PrivateKeyStore(testDbConnection, new SecretBox(dbEncryptionKey))),
            },
        }),
        new DIDManager({
            store: new DIDStore(testDbConnection),
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
        new DataStore(testDbConnection),
        new DataStoreORM(testDbConnection),
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
                ...getDidKeyResolver(),
                ...webDidResolver(),
            }),
        }),
    ],
})
