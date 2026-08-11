import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { announcements } from '@/data/releases';
import type { Announcement, AnnouncementPlacement } from '@/types/Feature';
import { useUserRole } from './UserRoleProvider';

interface VisibilityState {
  seen: string[];
  dismissed: string[];
}

interface ReleaseVisibilityContextValue {
  activeAnnouncements: Announcement[];
  isCustomerAudience: boolean;
  isSeen: (id: string) => boolean;
  isDismissed: (id: string) => boolean;
  getAnnouncement: (placement: AnnouncementPlacement, featureId?: string) => Announcement | undefined;
  markSeen: (id: string) => void;
  dismiss: (id: string) => void;
  reset: () => void;
}

const EMPTY_STATE: VisibilityState = { seen: [], dismissed: [] };
const STORAGE_PREFIX = 'zwayam:release-visibility:v1';

const ReleaseVisibilityContext = createContext<ReleaseVisibilityContextValue | undefined>(undefined);

const isActive = (announcement: Announcement) => {
  const now = new Date();
  const start = new Date(`${announcement.activeFrom}T00:00:00`);
  const end = new Date(`${announcement.activeUntil}T23:59:59`);
  return now >= start && now <= end;
};

const readState = (key: string): VisibilityState => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return EMPTY_STATE;
    const parsed = JSON.parse(value) as Partial<VisibilityState>;
    return {
      seen: Array.isArray(parsed.seen) ? parsed.seen.filter((item): item is string => typeof item === 'string') : [],
      dismissed: Array.isArray(parsed.dismissed)
        ? parsed.dismissed.filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return EMPTY_STATE;
  }
};

export const useReleaseVisibility = () => {
  const context = useContext(ReleaseVisibilityContext);
  if (!context) throw new Error('useReleaseVisibility must be used within ReleaseVisibilityProvider');
  return context;
};

const ReleaseVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const { userRole } = useUserRole();
  const storageKey = `${STORAGE_PREFIX}:${userRole}`;
  const [state, setState] = useState<VisibilityState>(() => readState(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);
  const isCustomerAudience = userRole === 'customer' || userRole === 'customer-admin';

  useEffect(() => {
    setState(readState(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The interactive demo continues with in-memory state if storage is unavailable.
    }
  }, [loadedKey, state, storageKey]);

  const activeAnnouncements = useMemo(
    () =>
      announcements
        .filter((announcement) => announcement.audience.includes(userRole as 'customer' | 'customer-admin'))
        .filter(isActive)
        .sort((a, b) => b.priority - a.priority),
    [userRole],
  );

  const markSeen = useCallback((id: string) => {
    setState((current) =>
      current.seen.includes(id) ? current : { ...current, seen: [...current.seen, id] },
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setState((current) => ({
      seen: current.seen.includes(id) ? current.seen : [...current.seen, id],
      dismissed: current.dismissed.includes(id) ? current.dismissed : [...current.dismissed, id],
    }));
  }, []);

  const reset = useCallback(() => setState(EMPTY_STATE), []);

  const value = useMemo<ReleaseVisibilityContextValue>(
    () => ({
      activeAnnouncements,
      isCustomerAudience,
      isSeen: (id) => state.seen.includes(id),
      isDismissed: (id) => state.dismissed.includes(id),
      getAnnouncement: (placement, featureId) =>
        activeAnnouncements.find(
          (announcement) => announcement.placement === placement && (!featureId || announcement.featureId === featureId),
        ),
      markSeen,
      dismiss,
      reset,
    }),
    [activeAnnouncements, dismiss, isCustomerAudience, markSeen, reset, state.dismissed, state.seen],
  );

  return <ReleaseVisibilityContext.Provider value={value}>{children}</ReleaseVisibilityContext.Provider>;
};

export default ReleaseVisibilityProvider;
