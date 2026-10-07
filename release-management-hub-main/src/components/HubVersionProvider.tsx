import React, { createContext, useContext, useState } from 'react';

export type HubVersion = 'v1' | 'v2';

interface HubVersionContextType {
  version: HubVersion;
  setVersion: (version: HubVersion) => void;
}

const HubVersionContext = createContext<HubVersionContextType | undefined>(undefined);

export const useHubVersion = () => {
  const context = useContext(HubVersionContext);
  if (!context) {
    throw new Error('useHubVersion must be used within a HubVersionProvider');
  }
  return context;
};

const STORAGE_KEY = 'hubVersion';

const readStored = (): HubVersion => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'v2' ? 'v2' : 'v1';
  } catch {
    return 'v1';
  }
};

/* V1 is the shipped three-tab Feature Hub; V2 is the tab-less header with
   breadcrumbs and top-right CTAs. Both render the same routes, so switching is
   a layout change, never a navigation. */
const HubVersionProvider = ({ children }: { children: React.ReactNode }) => {
  const [version, setVersionState] = useState<HubVersion>(readStored);

  const setVersion = (next: HubVersion) => {
    setVersionState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Storage can be blocked; the choice then lasts for the session. */
    }
  };

  return (
    <HubVersionContext.Provider value={{ version, setVersion }}>
      {children}
    </HubVersionContext.Provider>
  );
};

export default HubVersionProvider;
