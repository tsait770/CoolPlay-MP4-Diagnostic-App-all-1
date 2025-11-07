import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

export type WalletType = 'mnemonic' | 'xprv' | 'wif' | 'private_key';
export type NetworkType = 'bitcoin-mainnet' | 'bitcoin-testnet';

export interface BitcoinWallet {
  id: string;
  label: string;
  type: WalletType;
  network: NetworkType;
  address?: string;
  derivation_path?: string;
  is_active: boolean;
  is_backed_up: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface EncryptionMeta {
  algorithm: string;
  kdf: string;
  salt: string;
  iv: string;
  iterations: number;
}

interface BitcoinWalletContextType {
  wallets: BitcoinWallet[];
  loading: boolean;
  biometricEnabled: boolean;
  autoLockTimeout: number;
  clipboardClearTime: number;
  
  loadWallets: () => Promise<void>;
  createWallet: (label: string, mnemonic: string, type: WalletType, address?: string) => Promise<boolean>;
  importWallet: (label: string, privateData: string, type: WalletType, address?: string) => Promise<boolean>;
  viewWalletKey: (walletId: string) => Promise<string | null>;
  exportWallet: (walletId: string) => Promise<string | null>;
  deleteWallet: (walletId: string) => Promise<boolean>;
  backupWallet: (walletId: string) => Promise<boolean>;
  setActiveWallet: (walletId: string) => Promise<boolean>;
  
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setAutoLockTimeout: (timeout: number) => Promise<void>;
  setClipboardClearTime: (time: number) => Promise<void>;
  
  authenticateUser: () => Promise<boolean>;
}

const BitcoinWalletContext = createContext<BitcoinWalletContextType | undefined>(undefined);

const DEVICE_KEY = 'bitcoin_wallet_device_key';
const BIOMETRIC_PREF = 'bitcoin_wallet_biometric';
const AUTO_LOCK_PREF = 'bitcoin_wallet_auto_lock';
const CLIPBOARD_PREF = 'bitcoin_wallet_clipboard';

export function BitcoinWalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<BitcoinWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabledState] = useState(true);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(60);
  const [clipboardClearTime, setClipboardClearTimeState] = useState(30);

  const getOrCreateDeviceKey = useCallback(async (): Promise<string> => {
    try {
      let key = await SecureStore.getItemAsync(DEVICE_KEY);
      if (!key) {
        key = CryptoJS.lib.WordArray.random(32).toString();
        await SecureStore.setItemAsync(DEVICE_KEY, key, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      }
      return key;
    } catch (error) {
      console.error('[BitcoinWallet] Error with device key:', error);
      throw new Error('Failed to access secure storage');
    }
  }, []);

  const encryptData = useCallback(async (plaintext: string): Promise<{ encrypted: string; meta: EncryptionMeta }> => {
    const deviceKey = await getOrCreateDeviceKey();
    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const iv = CryptoJS.lib.WordArray.random(16).toString();
    
    const key = CryptoJS.PBKDF2(deviceKey, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();

    return {
      encrypted,
      meta: {
        algorithm: 'AES-256-CBC',
        kdf: 'PBKDF2',
        salt,
        iv,
        iterations: 10000,
      },
    };
  }, [getOrCreateDeviceKey]);

  const decryptData = useCallback(async (encrypted: string, meta: EncryptionMeta): Promise<string> => {
    const deviceKey = await getOrCreateDeviceKey();
    
    const key = CryptoJS.PBKDF2(deviceKey, meta.salt, {
      keySize: 256 / 32,
      iterations: meta.iterations,
    });

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(meta.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }, [getOrCreateDeviceKey]);

  const authenticateUser = useCallback(async (): Promise<boolean> => {
    if (!biometricEnabled) return true;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return true;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return true;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access wallet',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('[BitcoinWallet] Authentication error:', error);
      return false;
    }
  }, [biometricEnabled]);

  const loadWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bitcoin_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWallets(data || []);
    } catch (error) {
      console.error('[BitcoinWallet] Load error:', error);
      Alert.alert('Error', 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createWallet = useCallback(async (
    label: string,
    privateData: string,
    type: WalletType,
    address?: string
  ): Promise<boolean> => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    const authenticated = await authenticateUser();
    if (!authenticated) {
      Alert.alert('Error', 'Authentication failed');
      return false;
    }

    try {
      const { encrypted, meta } = await encryptData(privateData);

      const { error } = await supabase
        .from('bitcoin_wallets')
        .insert({
          user_id: user.id,
          label,
          type,
          network: 'bitcoin-mainnet',
          encrypted_blob: encrypted,
          encryption_meta: meta,
          address,
          is_active: false,
          is_backed_up: false,
        });

      if (error) throw error;

      await loadWallets();
      return true;
    } catch (error) {
      console.error('[BitcoinWallet] Create error:', error);
      Alert.alert('Error', 'Failed to create wallet');
      return false;
    }
  }, [user, authenticateUser, encryptData, loadWallets]);

  const importWallet = useCallback(async (
    label: string,
    privateData: string,
    type: WalletType,
    address?: string
  ): Promise<boolean> => {
    return createWallet(label, privateData, type, address);
  }, [createWallet]);

  const viewWalletKey = useCallback(async (walletId: string): Promise<string | null> => {
    const authenticated = await authenticateUser();
    if (!authenticated) {
      Alert.alert('Error', 'Authentication failed');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('bitcoin_wallets')
        .select('encrypted_blob, encryption_meta')
        .eq('id', walletId)
        .single();

      if (error) throw error;

      const decrypted = await decryptData(data.encrypted_blob, data.encryption_meta);

      await supabase.from('wallet_access_logs').insert({
        user_id: user?.id,
        wallet_id: walletId,
        action: 'view',
      });

      return decrypted;
    } catch (error) {
      console.error('[BitcoinWallet] View error:', error);
      Alert.alert('Error', 'Failed to decrypt wallet');
      return null;
    }
  }, [user, authenticateUser, decryptData]);

  const exportWallet = useCallback(async (walletId: string): Promise<string | null> => {
    return viewWalletKey(walletId);
  }, [viewWalletKey]);

  const deleteWallet = useCallback(async (walletId: string): Promise<boolean> => {
    const authenticated = await authenticateUser();
    if (!authenticated) {
      Alert.alert('Error', 'Authentication failed');
      return false;
    }

    try {
      const { error } = await supabase
        .from('bitcoin_wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      await loadWallets();
      return true;
    } catch (error) {
      console.error('[BitcoinWallet] Delete error:', error);
      Alert.alert('Error', 'Failed to delete wallet');
      return false;
    }
  }, [authenticateUser, loadWallets]);

  const backupWallet = useCallback(async (walletId: string): Promise<boolean> => {
    const authenticated = await authenticateUser();
    if (!authenticated) return false;

    try {
      const { error } = await supabase
        .from('bitcoin_wallets')
        .update({ is_backed_up: true, last_backup_at: new Date().toISOString() })
        .eq('id', walletId);

      if (error) throw error;

      await loadWallets();
      Alert.alert('Success', 'Wallet backed up successfully');
      return true;
    } catch (error) {
      console.error('[BitcoinWallet] Backup error:', error);
      Alert.alert('Error', 'Failed to backup wallet');
      return false;
    }
  }, [authenticateUser, loadWallets]);

  const setActiveWallet = useCallback(async (walletId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await supabase
        .from('bitcoin_wallets')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('bitcoin_wallets')
        .update({ is_active: true, last_used_at: new Date().toISOString() })
        .eq('id', walletId);

      if (error) throw error;

      await loadWallets();
      return true;
    } catch (error) {
      console.error('[BitcoinWallet] Set active error:', error);
      return false;
    }
  }, [user, loadWallets]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await SecureStore.setItemAsync(BIOMETRIC_PREF, enabled.toString());
  }, []);

  const setAutoLockTimeout = useCallback(async (timeout: number) => {
    setAutoLockTimeoutState(timeout);
    await SecureStore.setItemAsync(AUTO_LOCK_PREF, timeout.toString());
  }, []);

  const setClipboardClearTime = useCallback(async (time: number) => {
    setClipboardClearTimeState(time);
    await SecureStore.setItemAsync(CLIPBOARD_PREF, time.toString());
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      const bio = await SecureStore.getItemAsync(BIOMETRIC_PREF);
      const lock = await SecureStore.getItemAsync(AUTO_LOCK_PREF);
      const clip = await SecureStore.getItemAsync(CLIPBOARD_PREF);

      if (bio !== null) setBiometricEnabledState(bio === 'true');
      if (lock !== null) setAutoLockTimeoutState(parseInt(lock));
      if (clip !== null) setClipboardClearTimeState(parseInt(clip));
    };

    loadPreferences();
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const value: BitcoinWalletContextType = {
    wallets,
    loading,
    biometricEnabled,
    autoLockTimeout,
    clipboardClearTime,
    loadWallets,
    createWallet,
    importWallet,
    viewWalletKey,
    exportWallet,
    deleteWallet,
    backupWallet,
    setActiveWallet,
    setBiometricEnabled,
    setAutoLockTimeout,
    setClipboardClearTime,
    authenticateUser,
  };

  return (
    <BitcoinWalletContext.Provider value={value}>
      {children}
    </BitcoinWalletContext.Provider>
  );
}

export function useBitcoinWallet() {
  const context = useContext(BitcoinWalletContext);
  if (!context) {
    throw new Error('useBitcoinWallet must be used within BitcoinWalletProvider');
  }
  return context;
}
