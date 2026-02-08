import { useState, useEffect, useCallback } from 'react';
import { useCurrentIdentity } from '../useCurrentIdentity';
import {
  generateUserKey,
  encryptContent as cryptoEncryptContent,
  decryptContent as cryptoDecryptContent,
  encryptFileBytes as cryptoEncryptFileBytes,
  decryptFileBytes as cryptoDecryptFileBytes,
} from '../../lib/crypto/vaultCrypto';

export function useEncryptionSettings() {
  const { principal } = useCurrentIdentity();
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);

  // Load encryption setting from localStorage on mount
  useEffect(() => {
    if (principal) {
      const key = `encryption_enabled_${principal}`;
      const stored = localStorage.getItem(key);
      setEncryptionEnabled(stored === 'true');
    }
  }, [principal]);

  const toggleEncryption = useCallback(() => {
    if (principal) {
      const newValue = !encryptionEnabled;
      setEncryptionEnabled(newValue);
      const key = `encryption_enabled_${principal}`;
      localStorage.setItem(key, String(newValue));
    }
  }, [principal, encryptionEnabled]);

  const encryptContent = useCallback(
    async (content: string): Promise<string> => {
      if (!encryptionEnabled || !principal) {
        return content;
      }
      try {
        const userKey = await generateUserKey(principal);
        return await cryptoEncryptContent(content, userKey);
      } catch (error) {
        console.error('Encryption failed:', error);
        return content;
      }
    },
    [encryptionEnabled, principal]
  );

  const decryptContent = useCallback(
    async (content: string): Promise<string> => {
      if (!encryptionEnabled || !principal) {
        return content;
      }
      try {
        const userKey = await generateUserKey(principal);
        return await cryptoDecryptContent(content, userKey);
      } catch (error) {
        console.error('Decryption failed:', error);
        return content;
      }
    },
    [encryptionEnabled, principal]
  );

  const encryptFileBytes = useCallback(
    async (bytes: Uint8Array): Promise<Uint8Array> => {
      if (!encryptionEnabled || !principal) {
        return bytes;
      }
      try {
        const userKey = await generateUserKey(principal);
        return await cryptoEncryptFileBytes(bytes, userKey);
      } catch (error) {
        console.error('File encryption failed:', error);
        return bytes;
      }
    },
    [encryptionEnabled, principal]
  );

  const decryptFileBytes = useCallback(
    async (bytes: Uint8Array): Promise<Uint8Array> => {
      if (!encryptionEnabled || !principal) {
        return bytes;
      }
      try {
        const userKey = await generateUserKey(principal);
        return await cryptoDecryptFileBytes(bytes, userKey);
      } catch (error) {
        console.error('File decryption failed:', error);
        return bytes;
      }
    },
    [encryptionEnabled, principal]
  );

  return {
    encryptionEnabled,
    toggleEncryption,
    encryptContent,
    decryptContent,
    encryptFileBytes,
    decryptFileBytes,
  };
}

