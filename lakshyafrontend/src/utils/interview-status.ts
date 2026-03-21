import type { Interview } from '../services';

export type InterviewDisplayStatus = 'scheduled' | 'in_progress' | 'completed';
export type InterviewOutcomeValue = 'pass' | 'fail' | 'pending';

const parseMinutes = (value?: string): number | null => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();

  const hhmmssMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmssMatch) {
    const hour = Number(hhmmssMatch[1]);
    const minute = Number(hhmmssMatch[2]);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return hour * 60 + minute;
  }

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!ampmMatch) return null;

  const hour12 = Number(ampmMatch[1]);
  const minute = Number(ampmMatch[2]);
  const meridiem = ampmMatch[3].toUpperCase();

  if (!Number.isFinite(hour12) || !Number.isFinite(minute)) return null;
  if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null;

  const hour24 = hour12 % 12 + (meridiem === 'PM' ? 12 : 0);
  return hour24 * 60 + minute;
};

const to12Hour = (value: string): string => {
  const parsed = parseMinutes(value);
  if (parsed === null) return value;

  const hour24 = Math.floor(parsed / 60);
  const minute = parsed % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return `${String(hour12)}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

const parseDateOnly = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  // Accept Date objects directly
  if (value instanceof Date) {
    const d = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value !== 'string') return null;
  const datePart = value.split('T')[0];
  const parsed = new Date(datePart);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDateTime = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const hasExplicitTimePart = (value?: string | Date | null): boolean => {
  if (!value) return false;
  if (value instanceof Date) {
    return !(value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0);
  }
  return typeof value === 'string' && value.includes('T');
};

const getDayStart = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const normalizeLegacyOutcome = (value?: string): InterviewOutcomeValue => {
  if (value === 'pass' || value === 'passed') return 'pass';
  if (value === 'fail' || value === 'failed' || value === 'rejected') return 'fail';
  if (value === 'pending' || value === 'hold' || value === 'shortlisted') return 'pending';

  return 'pending';
};

export const getInterviewStartTime = (interview: Interview): string | undefined => {
  return interview.startTime || interview.time;
};

export const getInterviewOutcomeValue = (interview: Interview): InterviewOutcomeValue => {
  return normalizeLegacyOutcome(interview.outcome);
};

export const getInterviewEndTime = (interview: Interview): string | undefined => {
  if (interview.endTime) {
    return interview.endTime;
  }

  const start = getInterviewStartTime(interview);
  const startMinutes = parseMinutes(start);
  if (startMinutes === null) return undefined;

  const fallbackEndMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);
  const hours = Math.floor(fallbackEndMinutes / 60);
  const minutes = fallbackEndMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const formatInterviewTimeRange = (interview: Interview): string => {
  const start = getInterviewStartTime(interview);
  const end = getInterviewEndTime(interview);

  if (!start && !end) return '';
  if (start && end) return `${to12Hour(start)} - ${to12Hour(end)}`;

  return to12Hour(start || end || '');
};

export const getInterviewDisplayStatus = (
  interview: Interview,
  now: Date = new Date()
): InterviewDisplayStatus => {
  const outcome = getInterviewOutcomeValue(interview);
  if (outcome === 'pass' || outcome === 'fail') {
    return 'completed';
  }

  const interviewDate = parseDateOnly(interview.date);
  if (!interviewDate) {
    return 'scheduled';
  }

  const interviewDay = getDayStart(interviewDate);
  const currentDay = getDayStart(now);

  if (interviewDay.getTime() > currentDay.getTime()) {
    return 'scheduled';
  }

  if (interviewDay.getTime() < currentDay.getTime()) {
    return 'completed';
  }

  const start = parseMinutes(getInterviewStartTime(interview));
  const end = parseMinutes(getInterviewEndTime(interview));

  if (start !== null && end !== null && end > start) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes < start) return 'scheduled';
    if (nowMinutes >= start && nowMinutes <= end) return 'in_progress';
    return 'completed';
  }

  const interviewDateTime = parseDateTime(interview.date);
  if (interviewDateTime && hasExplicitTimePart(interview.date)) {
    const startAtMs = interviewDateTime.getTime();
    const endAtMs = startAtMs + 60 * 60 * 1000;
    const nowMs = now.getTime();

    if (nowMs < startAtMs) return 'scheduled';
    if (nowMs <= endAtMs) return 'in_progress';
    return 'completed';
  }

  // Legacy fallback: same-day records without usable time are treated as completed
  // so recruiters can still record outcome decisions.
  return 'completed';
};

export const getInterviewDisplayStatusMeta = (
  interview: Interview,
  now: Date = new Date()
): { label: string; colorClass: string; value: InterviewDisplayStatus } => {
  const value = getInterviewDisplayStatus(interview, now);

  if (value === 'in_progress') {
    return { label: 'In Progress', colorClass: 'bg-emerald-100 text-emerald-700', value };
  }

  if (value === 'completed') {
    return { label: 'Completed', colorClass: 'bg-gray-100 text-gray-700', value };
  }

  return { label: 'Scheduled', colorClass: 'bg-blue-100 text-blue-700', value };
};

export const getInterviewOutcomeMeta = (
  interview: Interview
): { label: string; colorClass: string; value: InterviewOutcomeValue } => {
  const value = getInterviewOutcomeValue(interview);

  if (value === 'pass') {
    return { label: 'Passed', colorClass: 'bg-green-100 text-green-700', value };
  }

  if (value === 'fail') {
    return { label: 'Rejected', colorClass: 'bg-red-100 text-red-700', value };
  }

  return { label: 'Pending Decision', colorClass: 'bg-gray-100 text-gray-700', value };
};
