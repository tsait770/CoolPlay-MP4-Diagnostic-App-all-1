import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useStorage, safeJsonParse } from '@/providers/StorageProvider';

export type MembershipTier = 'free_trial' | 'free' | 'basic' | 'premium';

interface MembershipState {
  tier: MembershipTier;
  usageCount: number;
  dailyUsageCount: number;
  lastResetDate: string;
  lastMonthlyResetDate: string;
  trialUsed: boolean;
  trialUsageRemaining: number;
  monthlyUsageRemaining: number;
  isFirstLogin: boolean;
}

interface MembershipLimits {
  trial: { total: number };
  free: { daily: number };
  basic: { monthly: number; dailyBonus: number };
  premium: { unlimited: boolean };
}

interface DeviceInfo {
  deviceId: string;
  lastLogin: string;
  deviceName?: string;
}

interface UsageStats {
  daily: number;
  monthly: number;
  total: number;
}

const MEMBERSHIP_LIMITS: MembershipLimits = {
  trial: { total: 2000 },
  free: { daily: 30 },
  basic: { monthly: 1500, dailyBonus: 40 },
  premium: { unlimited: true },
};

export const [MembershipProvider, useMembership] = createContextHook(() => {
  const { getItem, setItem } = useStorage();
  const [state, setState] = useState<MembershipState>({
    tier: 'free_trial',
    usageCount: 0,
    dailyUsageCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    lastMonthlyResetDate: new Date().toISOString().substring(0, 7),
    trialUsed: false,
    trialUsageRemaining: MEMBERSHIP_LIMITS.trial.total,
    monthlyUsageRemaining: 0,
    isFirstLogin: true,
  });
  
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    daily: 0,
    monthly: 0,
    total: 0,
  });

  const saveMembershipData = useCallback(async (data: MembershipState) => {
    if (!data || typeof data !== 'object') return;
    try {
      await setItem('membershipData', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save membership data:', error);
    }
  }, [setItem]);

  const loadMembershipData = useCallback(async () => {
    try {
      const data = await getItem('membershipData');
      if (data && typeof data === 'string' && data.length > 0) {
        const parsed = safeJsonParse(data, null);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          console.warn('[MembershipProvider] Invalid membership data format, resetting');
          const initialState: MembershipState = {
            tier: 'free_trial',
            usageCount: 0,
            dailyUsageCount: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            lastMonthlyResetDate: new Date().toISOString().substring(0, 7),
            trialUsed: false,
            trialUsageRemaining: MEMBERSHIP_LIMITS.trial.total,
            monthlyUsageRemaining: 0,
            isFirstLogin: true,
          };
          setState(initialState);
          await saveMembershipData(initialState);
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        if (parsed.lastResetDate !== today) {
          parsed.dailyUsageCount = 0;
          parsed.lastResetDate = today;
        }
        
        if (!parsed.lastMonthlyResetDate) {
          parsed.lastMonthlyResetDate = currentMonth;
        }
        
        if (parsed.lastMonthlyResetDate !== currentMonth && parsed.tier === 'basic') {
          console.log('[MembershipProvider] Monthly quota reset for Basic member');
          parsed.monthlyUsageRemaining = MEMBERSHIP_LIMITS.basic.monthly;
          parsed.lastMonthlyResetDate = currentMonth;
        }
        
        setState(parsed);
      } else {
        const initialState: MembershipState = {
          tier: 'free_trial',
          usageCount: 0,
          dailyUsageCount: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          lastMonthlyResetDate: new Date().toISOString().substring(0, 7),
          trialUsed: false,
          trialUsageRemaining: MEMBERSHIP_LIMITS.trial.total,
          monthlyUsageRemaining: 0,
          isFirstLogin: true,
        };
        setState(initialState);
        await saveMembershipData(initialState);
      }
    } catch (error) {
      console.error('Failed to load membership data:', error);
    }
  }, [getItem, saveMembershipData]);
  
  const loadDevices = useCallback(async () => {
    try {
      const data = await getItem('membershipDevices');
      if (data && typeof data === 'string' && data.length > 0) {
        const parsed = safeJsonParse(data, []);
        if (Array.isArray(parsed)) {
          setDevices(parsed);
        } else {
          console.warn('[MembershipProvider] Invalid devices format, clearing');
          await setItem('membershipDevices', JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error('[MembershipProvider] Failed to load devices:', error);
    }
  }, [getItem, setItem]);
  
  const saveDevices = useCallback(async (deviceList: DeviceInfo[]) => {
    try {
      await setItem('membershipDevices', JSON.stringify(deviceList));
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to save devices:', error);
    }
  }, [setItem]);
  
  const getMaxDevices = useCallback((tier: MembershipTier): number => {
    switch (tier) {
      case 'free_trial':
      case 'free':
        return 1;
      case 'basic':
        return 3;
      case 'premium':
        return 3;
      default:
        return 1;
    }
  }, []);
  
  const addDevice = useCallback(async (deviceId: string, deviceName?: string): Promise<boolean> => {
    const maxDevices = getMaxDevices(state.tier);
    
    if (devices.length >= maxDevices) {
      console.warn(`Maximum devices (${maxDevices}) reached for tier ${state.tier}`);
      return false;
    }
    
    const existingDevice = devices.find(d => d.deviceId === deviceId);
    if (existingDevice) {
      const updatedDevices = devices.map(d => 
        d.deviceId === deviceId 
          ? { ...d, lastLogin: new Date().toISOString() }
          : d
      );
      await saveDevices(updatedDevices);
      return true;
    }
    
    const newDevice: DeviceInfo = {
      deviceId,
      lastLogin: new Date().toISOString(),
      deviceName,
    };
    
    await saveDevices([...devices, newDevice]);
    return true;
  }, [devices, state.tier, saveDevices, getMaxDevices]);
  
  const removeDevice = useCallback(async (deviceId: string) => {
    const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
    await saveDevices(updatedDevices);
  }, [devices, saveDevices]);
  
  const supportsAdultContent = useCallback((): boolean => {
    return state.tier === 'free_trial' || state.tier === 'basic' || state.tier === 'premium';
  }, [state.tier]);
  
  const updateUsageStats = useCallback(async () => {
    const newStats: UsageStats = {
      daily: state.dailyUsageCount,
      monthly: state.usageCount,
      total: state.usageCount,
    };
    setUsageStats(newStats);
    
    try {
      const statsString = JSON.stringify(newStats);
      if (statsString.length < 100) {
        await setItem('usageStats', statsString);
      }
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }, [state.dailyUsageCount, state.usageCount, setItem]);

  const canUseFeature = useCallback((): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    if (state.lastResetDate !== today) {
      setState(prev => ({
        ...prev,
        dailyUsageCount: 0,
        lastResetDate: today,
      }));
    }
    
    if (state.lastMonthlyResetDate !== currentMonth && state.tier === 'basic') {
      console.log('[MembershipProvider] Resetting monthly quota for Basic member');
      setState(prev => ({
        ...prev,
        monthlyUsageRemaining: MEMBERSHIP_LIMITS.basic.monthly,
        lastMonthlyResetDate: currentMonth,
      }));
    }

    switch (state.tier) {
      case 'free_trial':
        return state.trialUsageRemaining > 0;
      case 'free':
        return state.dailyUsageCount < MEMBERSHIP_LIMITS.free.daily;
      case 'basic':
        return state.monthlyUsageRemaining > 0 || state.dailyUsageCount < MEMBERSHIP_LIMITS.basic.dailyBonus;
      case 'premium':
        return true;
      default:
        return false;
    }
  }, [state]);

  const useFeature = useCallback(async () => {
    if (!canUseFeature()) {
      return false;
    }

    const newState = { ...state };
    newState.usageCount++;
    newState.dailyUsageCount++;

    switch (state.tier) {
      case 'free_trial':
        newState.trialUsageRemaining--;
        if (newState.trialUsageRemaining === 0) {
          newState.tier = 'free';
          newState.trialUsed = true;
        }
        break;
      case 'basic':
        if (newState.monthlyUsageRemaining > 0) {
          newState.monthlyUsageRemaining--;
        }
        break;
    }

    setState(newState);
    await saveMembershipData(newState);
    return true;
  }, [state, canUseFeature, saveMembershipData]);

  const upgradeTier = useCallback(async (newTier: MembershipTier) => {
    const newState = {
      ...state,
      tier: newTier,
    };

    if (newTier === 'basic') {
      newState.monthlyUsageRemaining = MEMBERSHIP_LIMITS.basic.monthly;
    }

    setState(newState);
    await saveMembershipData(newState);
  }, [state, saveMembershipData]);

  const getRemainingUsage = useCallback((): number => {
    switch (state.tier) {
      case 'free_trial':
        return state.trialUsageRemaining;
      case 'free':
        return Math.max(0, MEMBERSHIP_LIMITS.free.daily - state.dailyUsageCount);
      case 'basic':
        return state.monthlyUsageRemaining + Math.max(0, MEMBERSHIP_LIMITS.basic.dailyBonus - state.dailyUsageCount);
      case 'premium':
        return -1;
      default:
        return 0;
    }
  }, [state]);

  const markFirstLoginComplete = useCallback(async () => {
    const newState = {
      ...state,
      isFirstLogin: false,
    };
    setState(newState);
    await saveMembershipData(newState);
  }, [state, saveMembershipData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMembershipData();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [loadMembershipData]);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDevices();
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [loadDevices]);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUsageStats();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [state.dailyUsageCount, state.usageCount, updateUsageStats]);

  return useMemo(() => ({
    ...state,
    devices,
    usageStats,
    canUseFeature,
    useFeature,
    upgradeTier,
    getRemainingUsage,
    markFirstLoginComplete,
    addDevice,
    removeDevice,
    getMaxDevices: () => getMaxDevices(state.tier),
    supportsAdultContent,
    limits: MEMBERSHIP_LIMITS,
  }), [
    state, 
    devices, 
    usageStats, 
    canUseFeature, 
    useFeature, 
    upgradeTier, 
    getRemainingUsage, 
    markFirstLoginComplete, 
    addDevice, 
    removeDevice, 
    getMaxDevices,
    supportsAdultContent
  ]);
});
