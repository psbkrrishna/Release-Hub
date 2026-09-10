import {
  ClipboardText, Briefcase, Heart, ChartBar, Buildings, UserPlus, Wallet,
  GraduationCap, Clock, Smiley, BookOpen,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import type { CSSProperties } from 'react';
import { RADIUS, T } from '@/styles/zerra';

/* How a module looks wherever it appears - the documentation grid, a module
   page, the Overview. Declared once so the same module never arrives looking
   two different ways.

   Icons are Phosphor, the app's one icon set. */

type Icon = ComponentType<{ size?: number | string; weight?: string }>;

const ICONS: Record<string, Icon> = {
  'Performance Management': ClipboardText,
  Recruiting: Briefcase,
  Benefits: Heart,
  Analytics: ChartBar,
  'Core HR': Buildings,
  Onboarding: UserPlus,
  Payroll: Wallet,
  'Learning & Development': GraduationCap,
  'Time Tracking': Clock,
  'Employee Experience': Smiley,
};

/** Falls back to a book, so a module added to MODULES renders before anyone
 *  has chosen an icon for it. */
export const moduleIcon = (name: string): Icon => ICONS[name] ?? BookOpen;

/* One tile treatment for every module. The five-colour rotation this replaced
   used green, amber and purple decoratively - colours the guidelines reserve
   for status and for anything new. */
export const MODULE_TILE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: RADIUS.control,
  background: T.brandSoft,
  color: T.brand,
};
