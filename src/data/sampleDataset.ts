/**
 * Realistic Sample Telephony Dataset using ONLY the 7 Official Sales Agents:
 * - 104: فلاح
 * - 107: چعبی
 * - 109: عربی
 * - 112: زمانی
 * - 113: ملکی
 * - 114: دهقانی پور
 * - 117: رحیمی
 */

import { CallRecord, DayOfWeekType } from '../types/telephony';
import { OFFICIAL_AGENTS_LIST } from '../utils/agentRegistry';
import { jalaliToGregorian } from '../utils/persianDate';

const AGENTS = [
  { id: '104', name: 'فلاح', performanceProfile: 'high' },
  { id: '107', name: 'چعبی', performanceProfile: 'high' },
  { id: '109', name: 'عربی', performanceProfile: 'medium' },
  { id: '112', name: 'زمانی', performanceProfile: 'medium' },
  { id: '113', name: 'ملکی', performanceProfile: 'medium' },
  { id: '114', name: 'دهقانی پور', performanceProfile: 'low' },
  { id: '117', name: 'رحیمی', performanceProfile: 'high' }
];

// Consecutive Persian week days: Saturday 1405/07/18 to Thursday 1405/07/23
// Month 7 = Mehr (مهر)
const DAYS_SPEC = [
  { jy: 1405, jm: 7, jd: 18, dayType: 'sat_to_wed' as DayOfWeekType, name: 'شنبه' },
  { jy: 1405, jm: 7, jd: 19, dayType: 'sat_to_wed' as DayOfWeekType, name: 'یکشنبه' },
  { jy: 1405, jm: 7, jd: 20, dayType: 'sat_to_wed' as DayOfWeekType, name: 'دوشنبه' },
  { jy: 1405, jm: 7, jd: 21, dayType: 'sat_to_wed' as DayOfWeekType, name: 'سه‌شنبه' },
  { jy: 1405, jm: 7, jd: 22, dayType: 'sat_to_wed' as DayOfWeekType, name: 'چهارشنبه' },
  { jy: 1405, jm: 7, jd: 23, dayType: 'thursday' as DayOfWeekType, name: 'پنج‌شنبه' },
];

function generatePhone(): string {
  const prefixes = ['0912', '0919', '0935', '0936', '0921', '0910', '0913', '0918'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${p}${rest}`;
}

export function generateRealisticSampleCalls(): CallRecord[] {
  const records: CallRecord[] = [];
  let callIdCounter = 1;

  DAYS_SPEC.forEach(daySpec => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const jalaliDateStr = `${daySpec.jy}/${pad(daySpec.jm)}/${pad(daySpec.jd)}`;
    
    // Convert to actual Date object
    const baseDate = jalaliToGregorian(daySpec.jy, daySpec.jm, daySpec.jd);
    const gy = baseDate.getFullYear();
    const gm = baseDate.getMonth();
    const gd = baseDate.getDate();

    const intervals = daySpec.dayType === 'thursday' 
      ? [
          { name: '09:00-11:00', startHour: 9, endHour: 11 },
          { name: '11:00-13:00', startHour: 11, endHour: 13 },
          { name: '13:00-15:00', startHour: 13, endHour: 15 }
        ]
      : [
          { name: '09:00-11:00', startHour: 9, endHour: 11 },
          { name: '11:00-13:00', startHour: 11, endHour: 13 },
          { name: '13:00-15:00', startHour: 13, endHour: 15 },
          { name: '15:00-17:00', startHour: 15, endHour: 17 }
        ];

    AGENTS.forEach(agent => {
      let callsPerInterval: number;
      let successRateProb: number;
      let approvedDurationProb: number;

      if (agent.performanceProfile === 'high') {
        callsPerInterval = daySpec.dayType === 'thursday' ? 36 : 38;
        successRateProb = 0.58;
        approvedDurationProb = 0.84;
      } else if (agent.performanceProfile === 'medium') {
        callsPerInterval = daySpec.dayType === 'thursday' ? 30 : 33;
        successRateProb = 0.48;
        approvedDurationProb = 0.65;
      } else {
        callsPerInterval = daySpec.dayType === 'thursday' ? 24 : 26;
        successRateProb = 0.38;
        approvedDurationProb = 0.42;
      }

      intervals.forEach((interval, intvIndex) => {
        const fluctuation = (intvIndex % 2 === 0 ? 2 : -2) + (Math.sin(intvIndex) > 0 ? 1 : -1);
        const count = Math.max(12, callsPerInterval + fluctuation);

        for (let i = 0; i < count; i++) {
          const minuteOffset = Math.floor((i / count) * 115) + Math.floor(Math.random() * 4);
          const startHr = interval.startHour + Math.floor(minuteOffset / 60);
          const startMin = minuteOffset % 60;
          const startSec = Math.floor(Math.random() * 59);

          const startTime = new Date(gy, gm, gd, startHr, startMin, startSec);
          const isSuccessful = Math.random() < successRateProb;

          let durationSeconds = 0;
          if (isSuccessful) {
            const inApproved = Math.random() < approvedDurationProb;
            if (inApproved) {
              durationSeconds = Math.floor(120 + Math.random() * 90);
            } else {
              if (Math.random() < 0.6) {
                durationSeconds = Math.floor(215 + Math.random() * 110);
              } else {
                durationSeconds = Math.floor(40 + Math.random() * 70);
              }
            }
          } else {
            durationSeconds = Math.random() < 0.7 ? 0 : Math.floor(5 + Math.random() * 10);
          }

          const customerPhone = generatePhone();
          const queueWait = Math.floor(Math.random() * 25);
          const ringDur = Math.floor(5 + Math.random() * 15);

          const rawTimeFormatted = `${pad(startHr)}:${pad(startMin)} - ${jalaliDateStr}`;

          records.push({
            id: `call_${callIdCounter++}`,
            source: agent.id,
            destination: customerPhone,
            startTime,
            callType: 'outbound',
            answerStatus: isSuccessful ? 'answered' : (Math.random() < 0.6 ? 'no_answer' : 'busy'),
            callStatus: isSuccessful ? 'successful' : 'unsuccessful',
            durationSeconds,
            queueWaitSeconds: queueWait,
            ringDurationSeconds: ringDur,
            route: 'OUT_TRUNK_1',
            routeName: 'خط اصلی خروجی',
            agentId: agent.id,
            agentName: agent.name,
            isEligible: true,
            isSuccessful,
            intervalSlot: interval.name,
            dateStr: jalaliDateStr,
            dayType: daySpec.dayType,
            rawStartTime: rawTimeFormatted,
            jalaliDateStr: jalaliDateStr,
            rowNumber: callIdCounter
          });
        }
      });
    });
  });

  return records;
}
