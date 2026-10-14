/**
 * Jalali (Shamsi) Date & Persian Formatting Utilities
 * Pure TypeScript, robust mathematical algorithm for Gregorian-Jalali conversions.
 */

import { DayOfWeekType } from '../types/telephony';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_DAY_NAMES = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

/**
 * Converts any Latin number or string with digits to Persian digits.
 */
export function toPersianDigits(input: number | string | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats a number with Persian thousand separators and Persian digits.
 */
export function formatPersianNumber(val: number | string, decimals: number = 0): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '۰';
  
  const fixed = decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString();
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  
  const combined = parts.length > 1 ? `${parts[0]}٫${parts[1]}` : parts[0];
  return toPersianDigits(combined);
}

/**
 * Formats duration in seconds into 'دقیقه:ثانیه' or 'ساعت:دقیقه:ثانیه'.
 */
export function formatDurationPersian(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '۰ ثانیه';
  const s = Math.round(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${toPersianDigits(hrs)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  }
  if (mins > 0) {
    return `${toPersianDigits(mins)} دقیقه و ${toPersianDigits(secs)} ثانیه`;
  }
  return `${toPersianDigits(secs)} ثانیه`;
}

/**
 * Formats duration as MM:SS or HH:MM:SS with Persian numerals.
 */
export function formatTimeDigitalPersian(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '۰۰:۰۰';
  const s = Math.round(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return toPersianDigits(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
  }
  return toPersianDigits(`${pad(mins)}:${pad(secs)}`);
}

/**
 * Converts Gregorian Date to Jalali (Solar Hijri) { jy, jm, jd }
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/**
 * Converts Jalali date { jy, jm, jd } to Gregorian Date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let sal_a: number[], gy: number, gm: number, gd: number, days: number;
  jy += 1595;
  days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (gm = 0; gm < 13; gm++) {
    let v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return new Date(gy, gm - 1, gd);
}

/**
 * Formats a Date object into a full Persian date string (e.g. شنبه ۲۱ مهر ۱۴۰۳)
 */
export function formatJalaliFull(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const dayOfWeek = PERSIAN_DAY_NAMES[date.getDay()];
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];

  return `${dayOfWeek} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Formats a Date or date string into standard Jalali format YYYY/MM/DD with Persian digits.
 */
export function formatJalaliShort(input: Date | string): string {
  if (!input) return '';
  if (typeof input === 'string') {
    const clean = normalizeDigitsToLatin(input).trim();
    // If already in Jalali format e.g. "1405/07/21" or "1405-07-21"
    const jm = clean.match(/^(13|14)\d{2}[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (jm) {
      const pad = (n: string) => n.padStart(2, '0');
      const parts = clean.split(/[\/\-]/);
      return toPersianDigits(`${parts[0]}/${pad(parts[1])}/${pad(parts[2].slice(0, 2))}`);
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) return toPersianDigits(input);
    return formatJalaliShort(d);
  }
  if (isNaN(input.getTime())) return '';
  const gy = input.getFullYear();
  const gm = input.getMonth() + 1;
  const gd = input.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

/**
 * Returns the exact Persian weekday name mathematically calculated from Date or Jalali string.
 * Example: "1405/07/21" -> "سه‌شنبه"
 */
export function getPersianWeekdayName(input: Date | string): string {
  if (!input) return '';
  let d: Date | null = null;

  if (input instanceof Date) {
    d = input;
  } else {
    const clean = normalizeDigitsToLatin(input).trim();
    const jm = clean.match(/^(13|14)\d{2}[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (jm) {
      const parts = clean.split(/[\/\-]/);
      const jy = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2].slice(0, 2), 10);
      d = jalaliToGregorian(jy, month, day);
    } else {
      d = new Date(clean);
    }
  }

  if (!d || isNaN(d.getTime())) return '';
  return PERSIAN_DAY_NAMES[d.getDay()];
}

/**
 * Formats a date into "روز_هفته، روز ماه سال" (e.g. "سه‌شنبه، ۲۱ مهر ۱۴۰۵")
 */
export function formatFullJalaliWithWeekday(input: Date | string): string {
  if (!input) return '';
  let d: Date | null = null;
  let jy = 0, jm = 0, jd = 0;

  if (input instanceof Date) {
    if (isNaN(input.getTime())) return '';
    d = input;
    const res = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    jy = res.jy; jm = res.jm; jd = res.jd;
  } else {
    const clean = normalizeDigitsToLatin(input).trim();
    const match = clean.match(/^(13|14)\d{2}[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (match) {
      const parts = clean.split(/[\/\-]/);
      jy = parseInt(parts[0], 10);
      jm = parseInt(parts[1], 10);
      jd = parseInt(parts[2].slice(0, 2), 10);
      d = jalaliToGregorian(jy, jm, jd);
    } else {
      d = new Date(clean);
      if (!isNaN(d.getTime())) {
        const res = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        jy = res.jy; jm = res.jm; jd = res.jd;
      }
    }
  }

  if (!d || isNaN(d.getTime()) || !jy) {
    return typeof input === 'string' ? toPersianDigits(input) : '';
  }

  const weekday = PERSIAN_DAY_NAMES[d.getDay()];
  const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';
  return `${weekday}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Compare two date strings chronologically across month and year boundaries.
 * Supports Jalali "1405/07/21" and ISO "2026-10-13".
 */
export function compareJalaliDates(dateA: string, dateB: string): number {
  if (dateA === dateB) return 0;
  const cleanA = normalizeDigitsToLatin(dateA).trim().replace(/-/g, '/');
  const cleanB = normalizeDigitsToLatin(dateB).trim().replace(/-/g, '/');
  return cleanA.localeCompare(cleanB);
}

/**
 * Formats time portion HH:mm
 */
export function formatTimePersian(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  const hrs = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return toPersianDigits(`${hrs}:${mins}`);
}

/**
 * Determine working schedule day type:
 * Saturday (6 in JS getDay) to Wednesday (3 in JS getDay) => 'sat_to_wed'
 * Thursday (4 in JS getDay) => 'thursday'
 * Friday (5 in JS getDay) => 'friday'
 */
export function getBusinessDayType(date: Date): DayOfWeekType {
  const day = date.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  if (day === 4) return 'thursday';
  if (day === 5) return 'friday';
  return 'sat_to_wed'; // Sat (6), Sun (0), Mon (1), Tue (2), Wed (3)
}

export function getDayTypeNamePersian(type: DayOfWeekType): string {
  switch (type) {
    case 'sat_to_wed':
      return 'شنبه تا چهارشنبه';
    case 'thursday':
      return 'پنج‌شنبه';
    case 'friday':
      return 'جمعه (تعطیل)';
  }
}

/**
 * Map call start time to 2-hour interval slot
 */
export function getIntervalSlot(date: Date, dayType: DayOfWeekType): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 09:00 - 11:00 (540 to 660 mins)
  if (totalMinutes >= 540 && totalMinutes < 660) {
    return '09:00-11:00';
  }
  // 11:00 - 13:00 (660 to 780 mins)
  if (totalMinutes >= 660 && totalMinutes < 780) {
    return '11:00-13:00';
  }
  // 13:00 - 15:00 (780 to 900 mins)
  if (totalMinutes >= 780 && totalMinutes < 900) {
    return '13:00-15:00';
  }
  // 15:00 - 17:00 (900 to 1020 mins) - valid for sat_to_wed
  if (dayType === 'sat_to_wed' && totalMinutes >= 900 && totalMinutes < 1020) {
    return '15:00-17:00';
  }

  // Outside standard intervals
  return 'خارج از بازه کاری';
}

/**
 * Returns the scheduled intervals list for a day type
 */
export function getScheduledIntervals(dayType: DayOfWeekType): string[] {
  if (dayType === 'thursday') {
    return ['09:00-11:00', '11:00-13:00', '13:00-15:00'];
  }
  return ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'];
}

/**
 * Mask sensitive phone number for privacy
 * 09123456789 -> ۰۹۱۲***۶۷۸۹
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const clean = phone.trim();
  if (clean.length <= 4) return clean; // internal extension e.g. 102
  if (clean.length === 11 && clean.startsWith('09')) {
    const masked = `${clean.substring(0, 4)}***${clean.substring(7)}`;
    return toPersianDigits(masked);
  }
  if (clean.length >= 8) {
    const start = clean.substring(0, 3);
    const end = clean.substring(clean.length - 3);
    return toPersianDigits(`${start}***${end}`);
  }
  return toPersianDigits(clean);
}

/**
 * Normalizes Persian and Arabic numerals to Latin ASCII digits (0-9).
 */
export function normalizeDigitsToLatin(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  return String(input)
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');
}

export interface ParsedDateTimeResult {
  date: Date;
  jalaliDateStr: string; // e.g. "1405/07/21"
  rawString: string;
}

/**
 * Robust date-time parser supporting:
 * - "15:05 - 1405/07/21" (Time first, hyphen, Jalali date)
 * - "۱۵:۰۵ - ۱۴۰۵/۰۷/۲۱" (Persian numerals)
 * - "1405/07/21 - 15:05" (Date first, time second)
 * - "1405/07/21 15:05:00"
 * - ISO / Gregorian strings
 * - Excel numeric serials
 */
export function parseJalaliDateTimeDetailed(val: any): ParsedDateTimeResult | null {
  if (val === undefined || val === null || val === '') return null;

  const rawString = String(val).trim();

  // 1. Direct Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const { jy, jm, jd } = gregorianToJalali(val.getFullYear(), val.getMonth() + 1, val.getDate());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      date: val,
      jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
      rawString
    };
  }

  // 2. Excel numeric serial number (e.g. 45580.416666667)
  if (typeof val === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const ms = val * 86400 * 1000;
    const d = new Date(excelEpoch.getTime() + ms);
    if (isNaN(d.getTime())) return null;
    const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      date: d,
      jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
      rawString
    };
  }

  // 3. String parsing - first normalize Persian/Arabic digits to Latin
  const normalized = normalizeDigitsToLatin(rawString).trim();
  if (!normalized) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Pattern A: Time first, separator, then Jalali Date
  // Example: "15:05 - 1405/07/21" or "15:05:30 - 1405/07/21" or "15:05-1405/07/21" or "15:05 1405/07/21"
  const timeFirstMatch = normalized.match(
    /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*[-_\/]?\s*(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
  );
  if (timeFirstMatch) {
    const hr = parseInt(timeFirstMatch[1], 10);
    const min = parseInt(timeFirstMatch[2], 10);
    const sec = timeFirstMatch[3] ? parseInt(timeFirstMatch[3], 10) : 0;
    const jy = parseInt(timeFirstMatch[4], 10);
    const jm = parseInt(timeFirstMatch[5], 10);
    const jd = parseInt(timeFirstMatch[6], 10);

    if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31 && hr >= 0 && hr < 24 && min >= 0 && min < 60) {
      const gDate = jalaliToGregorian(jy, jm, jd);
      gDate.setHours(hr, min, sec, 0);
      return {
        date: gDate,
        jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
        rawString
      };
    }
  }

  // Pattern B: Jalali Date first, optional separator, then Time
  // Example: "1405/07/21 - 15:05" or "1405/07/21 15:05:00" or "1405-07-21"
  const dateFirstMatch = normalized.match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s*[-_]?\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (dateFirstMatch) {
    const jy = parseInt(dateFirstMatch[1], 10);
    const jm = parseInt(dateFirstMatch[2], 10);
    const jd = parseInt(dateFirstMatch[3], 10);
    const hr = dateFirstMatch[4] ? parseInt(dateFirstMatch[4], 10) : 0;
    const min = dateFirstMatch[5] ? parseInt(dateFirstMatch[5], 10) : 0;
    const sec = dateFirstMatch[6] ? parseInt(dateFirstMatch[6], 10) : 0;

    if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31 && hr >= 0 && hr < 24 && min >= 0 && min < 60) {
      const gDate = jalaliToGregorian(jy, jm, jd);
      gDate.setHours(hr, min, sec, 0);
      return {
        date: gDate,
        jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
        rawString
      };
    }
  }

  // Pattern C: Day-first Jalali date e.g. "21/07/1405 - 15:05" or "21-07-1405 15:05"
  const dayFirstMatch = normalized.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s*[-_]?\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (dayFirstMatch) {
    const jd = parseInt(dayFirstMatch[1], 10);
    const jm = parseInt(dayFirstMatch[2], 10);
    const jy = parseInt(dayFirstMatch[3], 10);
    const hr = dayFirstMatch[4] ? parseInt(dayFirstMatch[4], 10) : 0;
    const min = dayFirstMatch[5] ? parseInt(dayFirstMatch[5], 10) : 0;
    const sec = dayFirstMatch[6] ? parseInt(dayFirstMatch[6], 10) : 0;

    if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31 && hr >= 0 && hr < 24 && min >= 0 && min < 60) {
      const gDate = jalaliToGregorian(jy, jm, jd);
      gDate.setHours(hr, min, sec, 0);
      return {
        date: gDate,
        jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
        rawString
      };
    }
  }

  // Pattern D: Gregorian Date parsing (e.g. "2026-10-13 15:05" or ISO)
  const parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) {
    const { jy, jm, jd } = gregorianToJalali(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
    return {
      date: parsed,
      jalaliDateStr: `${jy}/${pad(jm)}/${pad(jd)}`,
      rawString
    };
  }

  return null;
}

/**
 * Backward-compatible wrapper returning Date or null
 */
export function parseDateFlexible(val: any): Date | null {
  const res = parseJalaliDateTimeDetailed(val);
  return res ? res.date : null;
}

/**
 * Parses duration from various formats: seconds, "HH:MM:SS", "MM:SS", or decimal
 */
export function parseDurationFlexible(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') {
    if (val < 0) return 0;
    // Could it be an Excel time fraction? (e.g. 0.001157 is 100 seconds)
    if (val > 0 && val < 0.5 && val.toString().includes('.')) {
      // In Excel, 1 day = 1.0, so seconds = val * 86400
      const possibleSecs = Math.round(val * 86400);
      if (possibleSecs < 14400) {
        return possibleSecs;
      }
    }
    return Math.round(val);
  }

  const str = String(val).trim();
  if (!str) return 0;

  // If numeric string
  if (/^\d+(\.\d+)?$/.test(str)) {
    return Math.max(0, Math.round(parseFloat(str)));
  }

  // Time format: HH:MM:SS or MM:SS
  const parts = str.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return Math.max(0, h * 3600 + m * 60 + s);
  } else if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return Math.max(0, m * 60 + s);
  }

  return 0;
}
