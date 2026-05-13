import * as gamification from '@/lib/gamificationEngine';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type RedeemResult = { ok: boolean; message: string };

type GamificationContextValue = {
  wallet: gamification.Wallet;
  missions: gamification.MissionState[];
  redemptions: gamification.Redemption[];
  refresh: () => void;
  demoAdvance: (missionId: string, delta: number) => void;
  redeem: (rewardId: string) => RedeemResult;
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState(() => gamification.loadWallet());
  const [missions, setMissions] = useState(() => gamification.loadMissionStates());
  const [redemptions, setRedemptions] = useState(() => gamification.loadRedemptions());

  const refresh = useCallback(() => {
    setWallet(gamification.loadWallet());
    setMissions(gamification.loadMissionStates());
    setRedemptions(gamification.loadRedemptions());
  }, []);

  const demoAdvance = useCallback(
    (missionId: string, delta: number) => {
      gamification.demoAdvanceMission(missionId, delta);
      refresh();
    },
    [refresh],
  );

  const redeem = useCallback(
    (rewardId: string): RedeemResult => {
      const r = gamification.redeemReward(rewardId);
      refresh();
      return r;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ wallet, missions, redemptions, refresh, demoAdvance, redeem }),
    [wallet, missions, redemptions, refresh, demoAdvance, redeem],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be inside GamificationProvider');
  return ctx;
}
