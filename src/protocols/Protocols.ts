// Setup message protocols
import {TrustPing, TrustPingCallback} from "./TrustPing";
import {ConnectionServer, ConnectionServerCallback} from "./ConnectionServer";
import {ConnectionClient, ConnectionClientCallbacks} from "./ConnectionClient";
import {BasicMessage, BasicMessageCallback} from "./BasicMessage";
import {IssueCredentialMessage, IssueCredentialMessageCallback} from "./IssueCredentialMessage";
import {VerifierCallback, VerifierService} from "./VerifierService";
import {ProverCallback, ProverService} from "./ProverService";
import {createMessageHandler} from "./MessageHandler";

export const trustPing = new TrustPing(new TrustPingCallback())
export const connectionServer = new ConnectionServer(new ConnectionServerCallback())
export const connectionClient = new ConnectionClient(new ConnectionClientCallbacks())
export const basicMessage = new BasicMessage(new BasicMessageCallback())
export const issueCredentialMessage = new IssueCredentialMessage(new IssueCredentialMessageCallback())
export const verifierService = new VerifierService(new VerifierCallback())
export const proverService = new ProverService(new ProverCallback())
export const messageHandler = createMessageHandler(
    [trustPing, connectionServer, connectionClient, basicMessage, issueCredentialMessage, verifierService, proverService
    ]
)
