import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { seedTickets, sortTickets, type Ticket } from '@/data/tickets';

/* ---------------------------------------------------------------------------
   The signed-in customer's support tickets, plus whether the "Create ticket"
   dialog is open - it can be raised from the Overview hero and from the
   tickets page, so the dialog's state lives with the list it adds to.
   --------------------------------------------------------------------------- */

interface TicketStoreValue {
  tickets: Ticket[];
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  create: (t: { title: string; module: string; detail: string }) => Ticket;
}

const Ctx = createContext<TicketStoreValue | undefined>(undefined);

export const useTickets = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTickets must be used within a TicketStore');
  return v;
};

const TicketStore = ({ children }: { children: React.ReactNode }) => {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);
  const [createOpen, setCreateOpen] = useState(false);

  const create = useCallback((t: { title: string; module: string; detail: string }) => {
    const now = new Date().toISOString().slice(0, 19);
    let made!: Ticket;
    setTickets((cur) => {
      const next = cur.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
      made = {
        id: String(next),
        title: t.title,
        raw: 'Open',
        created: now,
        updated: now,
        via: 'Portal',
        module: t.module,
        chat: [['You', t.detail || t.title]],
      };
      return [made, ...cur];
    });
    toast.success('Ticket created. Support will reply here and by email');
    return made;
  }, []);

  const value = useMemo<TicketStoreValue>(
    () => ({
      tickets: sortTickets(tickets),
      createOpen,
      openCreate: () => setCreateOpen(true),
      closeCreate: () => setCreateOpen(false),
      create,
    }),
    [tickets, createOpen, create],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export default TicketStore;
