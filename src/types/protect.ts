export type ProtectAction = 'encrypt' | 'decrypt';

export interface ProtectOptions {
  userPassword: string;
  ownerPassword?: string;
}

export interface UnlockOptions {
  password: string;
}

export interface ProtectResult {
  action: ProtectAction;
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
}
