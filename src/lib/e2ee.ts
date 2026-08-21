"use client";

export const PRIVATE_KEY_STORAGE = "inkora-e2ee-private-key";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function generateUserKeyPair(): Promise<{
  publicKey: string;
  privateKeyJwk: string;
}> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", pair.publicKey),
    crypto.subtle.exportKey("jwk", pair.privateKey),
  ]);
  return {
    publicKey: bytesToBase64(new Uint8Array(publicKey)),
    privateKeyJwk: JSON.stringify(privateKey),
  };
}

export function savePrivateKey(privateKeyJwk: string): void {
  localStorage.setItem(PRIVATE_KEY_STORAGE, privateKeyJwk);
}

export function getPrivateKeyJwk(): string | null {
  return localStorage.getItem(PRIVATE_KEY_STORAGE);
}

async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    base64ToBytes(spkiBase64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

async function importPrivateKey(jwkJson: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwkJson),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(
  senderPrivateKeyJwk: string,
  recipientPublicKeySpki: string,
  plaintext: string
): Promise<{ encryptedContent: string; nonce: string }> {
  const privateKey = await importPrivateKey(senderPrivateKeyJwk);
  const recipientPublic = await importPublicKey(recipientPublicKeySpki);
  const sharedKey = await deriveSharedKey(privateKey, recipientPublic);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded
  );

  return {
    encryptedContent: bytesToBase64(new Uint8Array(ciphertext)),
    nonce: bytesToBase64(iv),
  };
}

export async function decryptMessage(
  recipientPrivateKeyJwk: string,
  senderPublicKeySpki: string,
  encryptedContent: string,
  nonce: string
): Promise<string> {
  const privateKey = await importPrivateKey(recipientPrivateKeyJwk);
  const senderPublic = await importPublicKey(senderPublicKeySpki);
  const sharedKey = await deriveSharedKey(privateKey, senderPublic);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(nonce) },
    sharedKey,
    base64ToBytes(encryptedContent)
  );

  return new TextDecoder().decode(plaintext);
}