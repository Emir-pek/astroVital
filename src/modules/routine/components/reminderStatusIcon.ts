import {
  AlarmClockCheck,
  BellRing,
  CircleCheck,
  CircleX,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { ReminderStatus } from '../services/reminderEngine';

/** Icon per reminder status — status is always icon + text, never colour alone ('late' ≠ 'done'). */
export const REMINDER_STATUS_ICON: Record<ReminderStatus, LucideIcon> = {
  upcoming: Clock,
  due: BellRing,
  done: CircleCheck,
  late: AlarmClockCheck,
  missed: CircleX,
};
