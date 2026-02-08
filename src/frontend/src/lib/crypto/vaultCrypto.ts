// WebCrypto-based encryption utilities for the secure vault

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Generate or retrieve a user-specific encryption key
 * Stored in browser localStorage, scoped to the user's principal
 */
export async function generateUserKey(principal: string): Promise<CryptoKey> {
  const storageKey = `vault_key_${principal}`;
  
  // Try to load existing key
  const storedKey = localStorage.getItem(storageKey);
  if (storedKey) {
    try {
      const keyData = base64ToArrayBuffer(storedKey);
      // Create a new Uint8Array to ensure we have ArrayBuffer, not SharedArrayBuffer
      const keyBuffer = new Uint8Array(keyData);
      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: ALGORITHM, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to load stored key, generating new one:', error);
    }
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  // Store the key
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(storageKey, arrayBufferToBase64(exportedKey));

  return key;
}

/**
 * Encrypt text content using AES-GCM
 */
export async function encryptContent(content: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt text content using AES-GCM
 */
export async function decryptContent(encryptedContent: string, key: CryptoKey): Promise<string> {
  try {
    const combined = base64ToArrayBuffer(encryptedContent);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt content');
  }
}

/**
 * Encrypt file bytes using AES-GCM
 */
export async function encryptFileBytes(bytes: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Create a new Uint8Array to ensure we have ArrayBuffer
  const bytesBuffer = new Uint8Array(bytes);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    bytesBuffer
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return combined;
}

/**
 * Decrypt file bytes using AES-GCM
 */
export async function decryptFileBytes(encryptedBytes: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  try {
    // Extract IV and encrypted data
    const iv = encryptedBytes.slice(0, IV_LENGTH);
    const data = encryptedBytes.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file');
  }
}

// Utility functions for base64 encoding/decoding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

