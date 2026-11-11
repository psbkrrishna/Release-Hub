import {
  type Icon as PhIcon, ChartBar, Clock, CurrencyInr, GraduationCap, HandWaving, Heart, IdentificationCard, Smiley, Target, UserPlus,
} from '@phosphor-icons/react';
import { KB_MODULES } from '@/data/knowledge';
import type { KbModule } from '@/types/Knowledge';

/* Module order and icons as the Release Hub V2 design lists them. Onboarding
   is not in the design; it keeps its place at the end. */
const ORDER = ['Recruiting', 'Performance Management', 'Core HR', 'Payroll', 'Benefits', 'Analytics', 'Learning & Development', 'Time Tracking', 'Employee Experience', 'Onboarding'];

export const MODULE_ICON: Record<string, PhIcon> = {
  Recruiting: UserPlus,
  'Performance Management': Target,
  'Core HR': IdentificationCard,
  Payroll: CurrencyInr,
  Benefits: Heart,
  Analytics: ChartBar,
  'Learning & Development': GraduationCap,
  'Time Tracking': Clock,
  'Employee Experience': Smiley,
  Onboarding: HandWaving,
};

export const DOC_MODULES: KbModule[] = [...KB_MODULES].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

/** Where "Documentation" lands: the first module, as in the design. */
export const DOCS_HOME = `/product-hub/knowledge/modules/${DOC_MODULES[0].slug}`;
