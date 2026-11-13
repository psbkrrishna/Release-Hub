import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { seedTickets, sortTickets, type Ticket } from '@/data/tickets';
import { useZeva } from '@/components/shell/ZevaStore';

/* ---------------------------------------------------------------------------
   The signed-in customer's support tickets.

   Tickets are raised through Zēva, as in the Release Hub V2 design: every
   "Raise a ticket" opens Zēva with a ticket command, and a ticket Zēva files
   lands here as an open ticket raised via Zēva. There is no separate create
   form.
   --------------------------------------------------------------------------- */

interface TicketStoreValue {
  tickets: Ticket[];
  /** Opens Zēva and starts the ticket conversation. */
  openCreate: () => void;
  /** A ticket Zēva has just filed. */
  addFromZeva: (t: { id: string; title: string; detail?: string }) => void;
}

const Ctx = createContext<TicketStoreValue | undefined>(undefined);

export const useTickets = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTickets must be used within a TicketStore');
  return v;
};

const TicketStore = ({ children }: { children: React.ReactNode }) => {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);
  const { openZeva } = useZeva();

  const addFromZeva = useCallback((t: { id: string; title: string; detail?: string }) => {
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    setTickets((cur) => [
      { id: t.id, title: t.title, raw: 'Open', created: now, updated: now, via: 'Zēva', module: 'Recruiting', chat: [['You', t.detail || t.title]], fresh: true },
      ...cur,
    ]);
  }, []);

  const value = useMemo<TicketStoreValue>(
    () => ({ tickets: sortTickets(tickets), openCreate: () => openZeva('ticket'), addFromZeva }),
    [tickets, openZeva, addFromZeva],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export default TicketStore;
