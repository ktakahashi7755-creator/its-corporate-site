import { Child, ChildWithAge } from '../types';

export function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function calcAgeLabel(birthDate: string): string {
  const age = calcAge(birthDate);
  if (age < 1) {
    const birth = new Date(birthDate);
    const today = new Date();
    const months =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    return `${months}ヶ月`;
  }
  return `${age}歳`;
}

export function enrichChild(child: Child): ChildWithAge {
  return {
    ...child,
    age: calcAge(child.birth_date),
    ageLabel: calcAgeLabel(child.birth_date),
  };
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', opts ?? { month: 'long', day: 'numeric', weekday: 'short' });
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, { month: 'numeric', day: 'numeric' });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // "HH:MM"
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function isToday(dateStr: string): boolean {
  return daysUntil(dateStr) === 0;
}

export function isTomorrow(dateStr: string): boolean {
  return daysUntil(dateStr) === 1;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function greetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'おやすみなさい';
  if (hour < 10) return 'おはようございます';
  if (hour < 17) return 'こんにちは';
  return 'こんばんは';
}

export function symptomLabel(symptom: string): string {
  const map: Record<string, string> = {
    fever: '発熱',
    cough: '咳',
    runny_nose: '鼻水',
    sore_throat: 'のどの痛み',
    stomachache: 'お腹の痛み',
    vomiting: '嘔吐',
    diarrhea: '下痢',
    rash: '発疹',
    headache: '頭痛',
    fatigue: 'だるさ',
    other: 'その他',
  };
  return map[symptom] ?? symptom;
}

export const COMMON_SYMPTOMS = [
  { key: 'fever', label: '発熱' },
  { key: 'cough', label: '咳' },
  { key: 'runny_nose', label: '鼻水' },
  { key: 'sore_throat', label: 'のどの痛み' },
  { key: 'stomachache', label: 'お腹の痛み' },
  { key: 'vomiting', label: '嘔吐' },
  { key: 'diarrhea', label: '下痢' },
  { key: 'rash', label: '発疹' },
  { key: 'headache', label: '頭痛' },
  { key: 'fatigue', label: 'だるさ' },
];
