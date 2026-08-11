import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast as sonner } from "sonner";
import { allFeatures } from "@/data/features";
import { useUserRole } from "@/components/UserRoleProvider";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

/* ---------------------------------------------------------------------------
   One source of feature state for the whole app. The hub, the detail page and
   What's New all read from here, so publishing a draft or toggling enablement
   shows up everywhere at once instead of in one page's local state.
   --------------------------------------------------------------------------- */

const FeatureStoreContext = createContext(undefined);

export const useFeatureStore = () => {
  const ctx = useContext(FeatureStoreContext);
  if (!ctx) throw new Error("useFeatureStore must be used within a FeatureStore");
  return ctx;
};

export const FeatureStore = ({ children }) => {
  const { userRole } = useUserRole();
  const [features, setFeatures] = useState(() => allFeatures.map((f) => ({ ...f })));
  const [pendingDelete, setPendingDelete] = useState(null);

  const isCreator = userRole === "creator";
  const isImplementation = userRole === "implementation";
  const isAdmin = userRole === "customer-admin";
  const canToggle = isAdmin || isCreator;

  /* sonner, configured the way production's AppLayout mounts it. The
     prototype had its own bottom-centre toast; production is top-right with
     rich colours and a close button, so that is what this uses. */
  const toast = useCallback((message, kind = "ok") => {
    if (kind === "warn") sonner.warning(message);
    else if (kind === "info") sonner.info(message);
    else sonner.success(message);
  }, []);

  const byId = useCallback((id) => features.find((f) => f.id === id), [features]);

  const patch = useCallback((id, next) => {
    setFeatures((current) => current.map((f) => (f.id === id ? { ...f, ...next } : f)));
  }, []);

  const toggleEnabled = useCallback(
    (id) => {
      if (!canToggle) {
        toast("Only a Customer Admin can change enablement.", "warn");
        return;
      }
      const f = features.find((x) => x.id === id);
      if (!f) return;
      const isEnabled = !f.isEnabled;
      patch(id, { isEnabled, status: isEnabled ? "Enabled" : "Disabled" });
      toast(`${f.title} ${isEnabled ? "enabled" : "disabled"}.`);
    },
    [canToggle, features, patch, toast],
  );

  const publish = useCallback(
    (id) => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      patch(id, { published: true });
      toast(`${f.title} published. Customers can see it now.`);
    },
    [features, patch, toast],
  );

  /* Published features are in customers' hands; only drafts can be dropped.
     Deletion goes through a confirm step (AlertDialog) rather than firing
     immediately - the old version deleted straight away, which is fine for
     an inert action but delete never is. */
  const requestDelete = useCallback(
    (id) => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      if (f.published) {
        toast(`${f.title} is published and can't be deleted.`, "warn");
        return;
      }
      setPendingDelete(f);
    },
    [features, toast],
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const { id, title } = pendingDelete;
    setFeatures((current) => current.filter((x) => x.id !== id));
    setPendingDelete(null);
    toast(`${title} deleted.`);
  }, [pendingDelete, toast]);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const upsert = useCallback(
    (feature, isEdit) => {
      if (isEdit) {
        setFeatures((current) => current.map((f) => (f.id === feature.id ? { ...f, ...feature } : f)));
        toast(`${feature.title} updated.`);
        return;
      }
      setFeatures((current) => {
        const next = current.reduce((max, f) => Math.max(max, Number(f.id.slice(5)) || 0), 0) + 1;
        return [...current, { ...feature, id: `FEAT-${String(next).padStart(3, "0")}` }];
      });
      // New features start unpublished. Publishing is a deliberate second act.
      toast(`${feature.title} created. Publish it to make it visible to customers.`);
    },
    [toast],
  );

  const requestAction = useCallback(
    (id, kind) => {
      const f = features.find((x) => x.id === id);
      if (!f) return;
      if (kind === "enable") {
        patch(id, { status: "Enablement requested" });
        toast(`Enablement requested for ${f.title}. Your CSM has been notified.`);
      } else {
        toast(`Deferment requested for ${f.title} — deferrable until ${f.deferrableTill || "the release window closes"}.`);
      }
    },
    [features, patch, toast],
  );

  const resetDemo = useCallback(() => {
    setFeatures(allFeatures.map((f) => ({ ...f })));
    toast("Demo data reset.");
  }, [toast]);

  const visibleFeatures = useMemo(
    () => (isCreator ? features : features.filter((f) => f.published)),
    [features, isCreator],
  );

  const value = useMemo(
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
      requestDelete,
      pendingDelete,
      confirmDelete,
      cancelDelete,
      upsert,
      requestAction,
      resetDemo,
      toast,
    }),
    [
      features, visibleFeatures, isCreator, isImplementation, isAdmin, canToggle,
      byId, toggleEnabled, publish, requestDelete, pendingDelete, confirmDelete,
      cancelDelete, upsert, requestAction, resetDemo, toast,
    ],
  );

  return (
    <FeatureStoreContext.Provider value={value}>
      {children}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" hasn't been published, so nothing customer-facing is affected. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete feature</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeatureStoreContext.Provider>
  );
};

export default FeatureStore;
