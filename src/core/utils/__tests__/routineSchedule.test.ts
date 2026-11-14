import { describe, expect, it } from 'vitest';
import type { ReminderTemplate } from '@core/types';
import { isScheduledOn } from '@core/utils';

type Rule = Pick<ReminderTemplate, 'repeat' | 'restEveryNDays' | 'anchorDay'>;

const daily: Rule = { repeat: 'daily' };
const exercise: Rule = { repeat: 'daily', restEveryNDays: 7 };
const weekly: Rule = { repeat: 'weekly' };
const weeklyFrom3: Rule = { repeat: 'weekly', anchorDay: 3 };
const monthly: Rule = { repeat: 'monthly' };
const monthlyFrom5: Rule = { repeat: 'monthly', anchorDay: 5 };

describe('isScheduledOn', () => {
  it.each<[string, Rule, number, boolean]>([
    ['daily, day 1', daily, 1, true],
    ['daily, day 7', daily, 7, true],
    ['exercise, day 6', exercise, 6, true],
    ['exercise rests on day 7', exercise, 7, false],
    ['exercise back on day 8', exercise, 8, true],
    ['exercise rests on day 14', exercise, 14, false],
    ['twice_daily with rest day', { repeat: 'twice_daily', restEveryNDays: 7 }, 21, false],
    ['weekly, day 1', weekly, 1, true],
    ['weekly, day 2', weekly, 2, false],
    ['weekly, day 7', weekly, 7, false],
    ['weekly, day 8', weekly, 8, true],
    ['weekly, day 15', weekly, 15, true],
    ['monthly, day 1', monthly, 1, true],
    ['monthly, day 30', monthly, 30, false],
    ['monthly, day 31', monthly, 31, true],
    ['monthly, day 61', monthly, 61, true],
    ['weekly anchor 3: day 1 is before anchor', weeklyFrom3, 1, false],
    ['weekly anchor 3: day 3', weeklyFrom3, 3, true],
    ['weekly anchor 3: day 10', weeklyFrom3, 10, true],
    ['weekly anchor 3: day 8', weeklyFrom3, 8, false],
    ['monthly anchor 5: day 5', monthlyFrom5, 5, true],
    ['monthly anchor 5: day 35', monthlyFrom5, 35, true],
    ['monthly anchor 5: day 31', monthlyFrom5, 31, false],
    ['before mission start (day 0)', daily, 0, false],
    ['before mission start (day -1)', weekly, -1, false],
    ['non-integer day', daily, 1.5, false],
  ])('%s → %s', (_label, rule, day, expected) => {
    expect(isScheduledOn(rule, day)).toBe(expected);
  });

  it('restEveryNDays is ignored for weekly tasks', () => {
    expect(isScheduledOn({ repeat: 'weekly', restEveryNDays: 7 }, 8)).toBe(true);
  });
});
