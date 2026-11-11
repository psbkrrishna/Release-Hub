import React, { createContext, useContext } from 'react';

/* The V1/V2 comparison toggle is retired: there is one hub now, the Release Hub
   V2 design. The hook stays so existing callers keep compiling, and always
   answers 'v2'. */
export type HubVersion = 'v2';

const HubVersionContext = createContext<{ version: HubVersion }>({ version: 'v2' });

export const useHubVersion = () => useContext(HubVersionContext);

const HubVersionProvider = ({ children }: { children: React.ReactNode }) => (
  <HubVersionContext.Provider value={{ version: 'v2' }}>{children}</HubVersionContext.Provider>
);

export default HubVersionProvider;
