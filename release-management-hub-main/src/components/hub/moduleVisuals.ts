import {
  ClipboardList, Briefcase, Heart, BarChart3, Building2, UserPlus, Wallet,
  GraduationCap, Clock, Smile, BookOpen,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { KbModule } from '@/types/Knowledge';

/* How a module looks wherever it appears - the Knowledge Hub grid, a module
   page, the Home tab. Declared once so the same module never arrives in two
   different colours. */

type Icon = ComponentType<{ size?: number | string; className?: string }>;

const ICONS: Record<string, Icon> = {
  'Performance Management': ClipboardList,
  Recruiting: Briefcase,
  Benefits: Heart,
  Analytics: BarChart3,
  'Core HR': Building2,
  Onboarding: UserPlus,
  Payroll: Wallet,
  'Learning & Development': GraduationCap,
  'Time Tracking': Clock,
  'Employee Experience': Smile,
};

/** Falls back to a book, so a module added to MODULES renders before anyone
 *  has chosen an icon for it. */
export const moduleIcon = (name: string): Icon => ICONS[name] ?? BookOpen;

export const TONE_TINT: Record<KbModule['tone'], string> = {
  brand: 'bg-brand-soft text-brand',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-500',
  amber: 'bg-amber-50 text-amber-700',
  neutral: 'bg-ink-50 text-ink-700',
};
