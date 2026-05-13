import React, { createContext, useContext, useMemo, useState } from 'react';

type DemoGpsContextValue = {
  simulateAtClient: boolean;
  setSimulateAtClient: (v: boolean) => void;
};

const DemoGpsContext = createContext<DemoGpsContextValue | null>(null);

export function DemoGpsProvider({ children }: { children: React.ReactNode }) {
  const [simulateAtClient, setSimulateAtClient] = useState(false);
  const value = useMemo(
    () => ({ simulateAtClient, setSimulateAtClient }),
    [simulateAtClient],
  );
  return <DemoGpsContext.Provider value={value}>{children}</DemoGpsContext.Provider>;
}

export function useDemoGps() {
  const ctx = useContext(DemoGpsContext);
  if (!ctx) {
    throw new Error('useDemoGps must be used within DemoGpsProvider');
  }
  return ctx;
}
