import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast as sonner } from 'sonner';
import { allFeatures } from '@/data/features';
import type { Feature } from '@/types/Feature';
import { useUserRole } from '@/components/UserRoleProvider';

/* ---------------------------------------------------------------------------
   One source of feature state for the whole app. The hub, the detail page and
   What's New all read from here, so publishing a draft or toggling enablement
   shows up everywhere at once instead of in one page's local state.
   --------------------------------------------------------------------------- */

type ToastKind = 'ok' | 'warn' | 'info';

interface FeatureStoreValue {
  features: Feature[];
  /** Everything the signed-in role is allowed to see. Unpublished features
   *  exist only for their creator, so every customer-facing surface reads
   *  through this and a draft cannot leak out by omission. */
  visibleFeatures: Feature[];
  isCreator: boolean;
  isImplementation: boolean;
  isAdmin: boolean;
  canToggle: boolean;
  byId: (id: string) => Feature | undefined;
  toggleEnabled: (id: string) => void;
  publish: (id: string) => void;
  remove: (id: string) => void;
  upsert: (feature: Feature, isEdit: boolean) => void;
  requestAction: (id: string, kind: 'enable' | 'defer') => void;
  resetDemo: () => void;
  toast: (message: string, kind?: ToastKind) => void;
}

const FeatureStoreContext = createContext<FeatureStoreValue | undefined>(undefined);

export const useFeatureStore = () => {
  const ctx = useContext(FeatureStoreContext);
  if (!ctx) throw new Error('useFeatureStore must be used within a FeatureStore');
  return ctx;
};

const FeatureStore = ({ children }: { children: React.ReactNode }) => {
  const { userRole } = useUserRole();
  const [features, setFeatures] = useState<Feature[]>(() => allFeatures.map((f) => ({ ...f })));

  const isCreator = userRole === 'creator';
  const isImplementation = userRole === 'implementation';
  const isAdmin = userRole === 'customer-admin';
  const canToggle = isAdmin || isCreator;

  /* sonner, configured the way production's AppLayout does it. The prototype
     had its own bottom-centre toast; production is top-right with rich colours
     and a close button, so that is what this uses. */
  const toast = useCallback((message: string, kind: ToastKind = 'ok') => {
    if (kind === 'warn') sonner.warning(message);
    else if (kind === 'info') sonner.info(message);
    else sonner.success(message);
  }, []);

  const byId = useCallback((id: string) => features.find((f) => f.id === id), [features]);

  const patch = useCallback((id: string, next: Partial<Feature>) => {
    setFeatures((current) => current.map((f) => (f.id === id ? { ...f, ...next } : f)));
  }, []);

  const toggleEnabled = useCallback(
    (id: string) => {
      if (!canToggle) {
        toast('Only a Customer Admin can change enablement.', 'warn');
        return;
      }
      const f = features.find((x) => x.id === id);
      if (!f) return;
      const isEnabled = !f.isEnabled;
      patch(id, { isEnabled, status: isEnabled ? 'Enabled' : 'Disabled' });
      toast(`${f.title} ${isEnabled ? 'enabled' : 'disabled'}.`);
    },
    [canToggle, features, patch, toast],
  );

  const publish = useCallback(
    (id: string) => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      patch(id, { published: true });
      toast(`${f.title} published. Customers can see it now.`);
    },
    [features, patch, toast],
  );

  const remove = useCallback(
    (id: string) => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      // Published features are in customers' hands; only drafts can be dropped.
      if (f.published) {
        toast(`${f.title} is published and can't be deleted.`, 'warn');
        return;
      }
      setFeatures((current) => current.filter((x) => x.id !== id));
      toast(`${f.title} deleted.`);
    },
    [features, toast],
  );

  const upsert = useCallback(
    (feature: Feature, isEdit: boolean) => {
      if (isEdit) {
        setFeatures((current) => current.map((f) => (f.id === feature.id ? { ...f, ...feature } : f)));
        toast(`${feature.title} updated.`);
        return;
      }
      setFeatures((current) => {
        const next = current.reduce((max, f) => Math.max(max, Number(f.id.slice(5)) || 0), 0) + 1;
        return [...current, { ...feature, id: `FEAT-${String(next).padStart(3, '0')}` }];
      });
      // New features start unpublished. Publishing is a deliberate second act.
      toast(`${feature.title} created. Publish it to make it visible to customers.`);
    },
    [toast],
  );

  const requestAction = useCallback(
    (id: string, kind: 'enable' | 'defer') => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      if (kind === 'enable') {
        patch(id, { status: 'Enablement requested' });
        toast(`Enablement requested for ${f.title}. Your CSM has been notified.`);
      } else {
        toast(`Deferment requested for ${f.title} — deferrable until ${f.deferrableTill || 'the release window closes'}.`);
      }
    },
    [features, patch, toast],
  );

  const resetDemo = useCallback(() => {
    setFeatures(allFeatures.map((f) => ({ ...f })));
    toast('Demo data reset.');
  }, [toast]);

  const visibleFeatures = useMemo(
    () => (isCreator ? features : features.filter((f) => f.published)),
    [features, isCreator],
  );

  const value = useMemo<FeatureStoreValue>(
    () => ({
      features,
      visibleFeatures,
      isCreator,
      isImplementation,
      isAdmin,
      canToggle,
      byId,
      toggleEnabled,
      publish,
      remove,
      upsert,
      requestAction,
      resetDemo,
      toast,
    }),
    [
      features, visibleFeatures, isCreator, isImplementation, isAdmin, canToggle,
      byId, toggleEnabled, publish, remove, upsert, requestAction, resetDemo, toast,
    ],
  );

  return <FeatureStoreContext.Provider value={value}>{children}</FeatureStoreContext.Provider>;
};

export default FeatureStore;
