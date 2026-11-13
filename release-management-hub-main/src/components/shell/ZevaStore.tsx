import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   Whether the Zēva drawer is open, and what it was asked to do on opening.

   In the Release Hub V2 design, every "Raise a ticket" is Zēva with a command:
   the drawer opens and starts the ticket conversation. The top bar's Zēva
   button just toggles it. Opening Zēva also collapses the side rail, as the
   design does, so the rail does not sit under the drawer's scrim.
   --------------------------------------------------------------------------- */

export interface ZevaCommand { nonce: number; kind: 'ask' | 'ticket'; text?: string }

interface ZevaValue {
  open: boolean;
  command: ZevaCommand | null;
  openZeva: (kind?: 'ask' | 'ticket', text?: string) => void;
  closeZeva: () => void;
  toggleZeva: () => void;
}

const Ctx = createContext<ZevaValue | undefined>(undefined);

export const useZeva = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZeva must be used within a ZevaStore');
  return v;
};

/** Sent so the rail can fold itself away when Zēva opens. */
export const COLLAPSE_RAIL = 'zw:collapse-rail';

const ZevaStore = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState<ZevaCommand | null>(null);

  const openZeva = useCallback((kind?: 'ask' | 'ticket', text?: string) => {
    window.dispatchEvent(new Event(COLLAPSE_RAIL));
    if (kind) setCommand({ nonce: Date.now(), kind, text });
    setOpen(true);
  }, []);
  const closeZeva = useCallback(() => setOpen(false), []);
  const toggleZeva = useCallback(() => setOpen((o) => { if (!o) window.dispatchEvent(new Event(COLLAPSE_RAIL)); return !o; }), []);

  const value = useMemo(() => ({ open, command, openZeva, closeZeva, toggleZeva }), [open, command, openZeva, closeZeva, toggleZeva]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export default ZevaStore;
