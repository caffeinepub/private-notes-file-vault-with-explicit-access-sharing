import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type NoteId = string;
export interface File {
    id: FileId;
    content: ExternalBlob;
    displayName: string;
    owner: Principal;
    cryptedSymmetricKey?: Uint8Array;
    description: string;
    sharedWith: Array<Principal>;
}
export interface AdminPaywallStatus {
    principal: Principal;
    paywallStatus: PaywallStatus;
    totalStorage: bigint;
}
export interface PaywallStatus {
    hasPaid: boolean;
    planLabel?: string;
    paidUntil?: bigint;
}
export interface NoteSub {
    id: NoteId;
    title: string;
    owner: Principal;
    cryptedSymmetricKey?: Uint8Array;
    sharedWith: Array<Principal>;
}
export type FileId = string;
export interface FileSub {
    id: FileId;
    displayName: string;
    owner: Principal;
    cryptedSymmetricKey?: Uint8Array;
    description: string;
    sharedWith: Array<Principal>;
}
export interface UserProfile {
    name: string;
}
export interface Note {
    id: NoteId;
    title: string;
    content: string;
    owner: Principal;
    cryptedSymmetricKey?: Uint8Array;
    sharedWith: Array<Principal>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createNote(title: string, content: string): Promise<NoteId>;
    deleteFile(id: FileId): Promise<void>;
    deleteNote(id: NoteId): Promise<void>;
    getAllAdminPaywallStates(): Promise<Array<AdminPaywallStatus>>;
    getCallerPaywallStatus(): Promise<PaywallStatus>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFile(id: FileId): Promise<File>;
    getMySharedWithMe(): Promise<Array<string>>;
    getPaywallStatus(_user: Principal): Promise<PaywallStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listFiles(): Promise<Array<FileSub>>;
    listNotes(): Promise<Array<NoteSub>>;
    readNote(id: NoteId): Promise<Note>;
    revokeAccess(itemType: string, id: string, recipient: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPaywallStatus(user: Principal, hasPaid: boolean, planLabel: string | null, paidUntil: bigint | null): Promise<void>;
    shareItem(itemType: string, id: string, recipient: Principal): Promise<void>;
    updateFileMetadata(id: FileId, displayName: string, description: string): Promise<void>;
    updateNote(id: NoteId, title: string, content: string): Promise<void>;
    uploadFile(displayName: string, blob: ExternalBlob): Promise<FileId>;
}
