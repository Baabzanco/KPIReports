/**
 * Comprehensive Unit Test Suite for KPI Calculation Engine
 * Covers all boundary conditions, Thursday vs Sat-Wed targets, 60-point boundary,
 * stability, and bonus points.
 */

import {
  calculateKPI1,
  calculateKPI2,
  calculateKPI3,
  calculateKPI4,
  calculateKPI5,
  calculateKPI6,
  calculateDailyBonus,
  categorizeScore
} from './kpiEngine';
import { parseJalaliDateTimeDetailed } from './persianDate';

export interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  notes?: string;
}

export function runKPITestSuite(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  const assert = (suite: string, name: string, actual: any, expected: any, notes?: string) => {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ suite, name, passed, expected, actual, notes });
  };

  // 1. KPI 1: Duration Tests (Target 120m for Sat-Wed, 90m for Thu)
  assert('KPI 1 (مدت مکالمه)', 'Sat-Wed: 120 دقیقه باید ۳۰ امتیاز بدهد', calculateKPI1(120, 'sat_to_wed').score, 30);
  assert('KPI 1 (مدت مکالمه)', 'Sat-Wed: 60 دقیقه باید ۱۵ امتیاز بدهد', calculateKPI1(60, 'sat_to_wed').score, 15);
  assert('KPI 1 (مدت مکالمه)', 'Sat-Wed: بیشتر از تارگت (150 دقیقه) حداکثر ۳۰ امتیاز دارد', calculateKPI1(150, 'sat_to_wed').score, 30);
  assert('KPI 1 (مدت مکالمه)', 'Thursday: 90 دقیقه باید ۳۰ امتیاز بدهد', calculateKPI1(90, 'thursday').score, 30);
  assert('KPI 1 (مدت مکالمه)', 'Thursday: 45 دقیقه باید ۱۵ امتیاز بدهد', calculateKPI1(45, 'thursday').score, 15);
  assert('KPI 1 (مدت مکالمه)', '0 دقیقه باید ۰ امتیاز بدهد', calculateKPI1(0, 'sat_to_wed').score, 0);

  // 2. KPI 2: Success Rate Tests
  // <40% -> 0 | 40-44.99% -> 8 | 45-49.99% -> 11 | 50-54.99% -> 15 | >=55% -> 20
  assert('KPI 2 (نرخ موفقیت)', 'زیر ۴۰ درصد (39%) -> 0 امتیاز', calculateKPI2(39, 100).score, 0);
  assert('KPI 2 (نرخ موفقیت)', 'مرز ۴۰ درصد -> ۸ امتیاز', calculateKPI2(40, 100).score, 8);
  assert('KPI 2 (نرخ موفقیت)', 'بازه ۴۵ درصد -> ۱۱ امتیاز', calculateKPI2(45, 100).score, 11);
  assert('KPI 2 (نرخ موفقیت)', 'بازه ۵۰ درصد -> ۱۵ امتیاز', calculateKPI2(50, 100).score, 15);
  assert('KPI 2 (نرخ موفقیت)', 'مرز ۵۵ درصد و بالاتر -> ۲۰ امتیاز', calculateKPI2(55, 100).score, 20);
  assert('KPI 2 (نرخ موفقیت)', 'مخرج صفر امن باشد و ۰ امتیاز دهد', calculateKPI2(0, 0).score, 0);

  // 3. KPI 3: Total Calls Volume Tests (145 Sat-Wed vs 110 Thu)
  assert('KPI 3 (تعداد کل تماس‌ها)', 'Sat-Wed: 145 تماس -> ۱۰ امتیاز', calculateKPI3(145, 'sat_to_wed').score, 10);
  assert('KPI 3 (تعداد کل تماس‌ها)', 'Sat-Wed: 72.5 تماس -> ۵ امتیاز', calculateKPI3(72.5, 'sat_to_wed').score, 5);
  assert('KPI 3 (تعداد کل تماس‌ها)', 'Thursday: 110 تماس -> ۱۰ امتیاز', calculateKPI3(110, 'thursday').score, 10);
  assert('KPI 3 (تعداد کل تماس‌ها)', 'عدم اجازه عبور از ۱۰ امتیاز در حالت پیش‌فرض (۱۶۰ تماس)', calculateKPI3(160, 'sat_to_wed', false).score, 10);
  assert('KPI 3 (تعداد کل تماس‌ها)', 'محاسبه پاداش مازاد تا ۱۵ امتیاز در صورت فعال بودن', calculateKPI3(200, 'sat_to_wed', true).score > 10, true);

  // 4. KPI 4: Successful Calls Count Tests
  // Sat-Wed: <50 (0), 50-65 (5), 66-79 (8), >=80 (15)
  // Thu:     <35 (0), 35-45 (5), 46-59 (8), >=60 (15)
  assert('KPI 4 (تعداد تماس موفق)', 'Sat-Wed: 49 تماس -> ۰ امتیاز', calculateKPI4(49, 'sat_to_wed').score, 0);
  assert('KPI 4 (تعداد تماس موفق)', 'Sat-Wed: 50 تماس -> ۵ امتیاز', calculateKPI4(50, 'sat_to_wed').score, 5);
  assert('KPI 4 (تعداد تماس موفق)', 'Sat-Wed: 66 تماس -> ۸ امتیاز', calculateKPI4(66, 'sat_to_wed').score, 8);
  assert('KPI 4 (تعداد تماس موفق)', 'Sat-Wed: 80 تماس -> ۱۵ امتیاز', calculateKPI4(80, 'sat_to_wed').score, 15);
  assert('KPI 4 (تعداد تماس موفق)', 'Thursday: 34 تماس -> ۰ امتیاز', calculateKPI4(34, 'thursday').score, 0);
  assert('KPI 4 (تعداد تماس موفق)', 'Thursday: 35 تماس -> ۵ امتیاز', calculateKPI4(35, 'thursday').score, 5);
  assert('KPI 4 (تعداد تماس موفق)', 'Thursday: 46 تماس -> ۸ امتیاز', calculateKPI4(46, 'thursday').score, 8);
  assert('KPI 4 (تعداد تماس موفق)', 'Thursday: 60 تماس -> ۱۵ امتیاز', calculateKPI4(60, 'thursday').score, 15);

  // 5. KPI 5: Approved Duration Range Tests (2m to 3:30m)
  // <30% -> 0 | 30-<50% -> 3 | 50-<80% -> 5 | >=80% -> 15
  assert('KPI 5 (مدت مجاز مکالمه)', 'درصد زیر ۳۰٪ -> ۰ امتیاز', calculateKPI5(29, 100).score, 0);
  assert('KPI 5 (مدت مجاز مکالمه)', 'درصد ۳۰٪ تا ۴۹.۹٪ -> ۳ امتیاز', calculateKPI5(30, 100).score, 3);
  assert('KPI 5 (مدت مجاز مکالمه)', 'درصد ۵۰٪ تا ۷۹.۹٪ -> ۵ امتیاز', calculateKPI5(50, 100).score, 5);
  assert('KPI 5 (مدت مجاز مکالمه)', 'درصد ۸۰٪ و بالاتر -> ۱۵ امتیاز', calculateKPI5(80, 100).score, 15);

  // 6. KPI 6: Performance Stability Tests
  // <50% -> 0 | 50-59.99% -> 2 | 60-69.99% -> 3 | 70-79.99% -> 4 | 80-89.99% -> 6 | >=90% -> 10
  assert('KPI 6 (پایداری عملکرد)', 'ثبات ۹۰٪ به بالا (20, 20, 20, 20) -> ۱۰ امتیاز', calculateKPI6([20, 20, 20, 20]).score, 10);
  assert('KPI 6 (پایداری عملکرد)', 'ثبات بین ۸۰ تا ۸۹٪ (16, 20, 20, 20: 16/19=84%) -> ۶ امتیاز', calculateKPI6([16, 20, 20, 20]).score, 6);
  assert('KPI 6 (پایداری عملکرد)', 'ثبات زیر ۵۰٪ (5, 20, 20, 20: 5/16.25=30%) -> ۰ امتیاز', calculateKPI6([5, 20, 20, 20]).score, 0);

  // 7. Bonus Points: Floor((actualMinutes - target) / 3)
  assert('سیستم پاداش', 'Sat-Wed: 120 دقیقه -> ۰ امتیاز پاداش', calculateDailyBonus(120, 'sat_to_wed'), 0);
  assert('سیستم پاداش', 'Sat-Wed: 123 دقیقه -> ۱ امتیاز پاداش', calculateDailyBonus(123, 'sat_to_wed'), 1);
  assert('سیستم پاداش', 'Sat-Wed: 135 دقیقه -> ۵ امتیاز پاداش', calculateDailyBonus(135, 'sat_to_wed'), 5);
  assert('سیستم پاداش', 'Thursday: 90 دقیقه -> ۰ امتیاز پاداش', calculateDailyBonus(90, 'thursday'), 0);
  assert('سیستم پاداش', 'Thursday: 93 دقیقه -> ۱ امتیاز پاداش', calculateDailyBonus(93, 'thursday'), 1);

  // 8. Performance Categories and 60-point Boundary Test
  assert('دسته‌بندی عملکرد', 'امتیاز ۹۵ -> مطلوب (optimal)', categorizeScore(95), 'optimal');
  assert('دسته‌بندی عملکرد', 'امتیاز ۸۵ -> نیازمند توجه (needs_attention)', categorizeScore(85), 'needs_attention');
  assert('دسته‌بندی عملکرد', 'امتیاز ۷۵ -> عملکرد نامطلوب (substandard)', categorizeScore(75), 'substandard');
  assert('دسته‌بندی عملکرد', 'امتیاز مرزی ۶۰ با تنظیم پیش‌فرض -> substandard', categorizeScore(60, 'substandard'), 'substandard');
  assert('دسته‌بندی عملکرد', 'امتیاز مرزی ۶۰ با تنظیم سخت‌گیرانه -> critical', categorizeScore(60, 'critical'), 'critical');
  assert('دسته‌بندی عملکرد', 'امتیاز ۵۵ -> بسیار ضعیف (critical)', categorizeScore(55), 'critical');

  // 9. Jalali Date-Time Parsing Tests (Exact Source Formats)
  const dt1 = parseJalaliDateTimeDetailed('15:05 - 1405/07/21');
  assert('پردازش تاریخ و زمان جلالی', 'قالب اصلی فایل اکسل (15:05 - 1405/07/21)', dt1 !== null && dt1.jalaliDateStr === '1405/07/21' && dt1.date.getHours() === 15 && dt1.date.getMinutes() === 5, true);

  const dt2 = parseJalaliDateTimeDetailed('14:58 - 1405/07/21');
  assert('پردازش تاریخ و زمان جلالی', 'نمونه دوم (14:58 - 1405/07/21)', dt2 !== null && dt2.date.getHours() === 14 && dt2.date.getMinutes() === 58, true);

  const dtPersian = parseJalaliDateTimeDetailed('۱۵:۰۵ - ۱۴۰۵/۰۷/۲۱');
  assert('پردازش تاریخ و زمان جلالی', 'پشتیبانی از ارقام فارسی (۱۵:۰۵ - ۱۴۰۵/۰۷/۲۱)', dtPersian !== null && dtPersian.jalaliDateStr === '1405/07/21' && dtPersian.date.getHours() === 15, true);

  const dtArabic = parseJalaliDateTimeDetailed('١٥:٠٥ - ١٤٠٥/٠٧/٢١');
  assert('پردازش تاریخ و زمان جلالی', 'پشتیبانی از ارقام عربی (١٥:٠٥ - ١٤٠٥/٠٧/٢١)', dtArabic !== null && dtArabic.jalaliDateStr === '1405/07/21' && dtArabic.date.getHours() === 15, true);

  const dtSpaces = parseJalaliDateTimeDetailed('  15:05   -   1405/07/21  ');
  assert('پردازش تاریخ و زمان جلالی', 'انعطاف در فاصله‌های خالی (Whitespace variations)', dtSpaces !== null && dtSpaces.jalaliDateStr === '1405/07/21', true);

  const dtNoSpace = parseJalaliDateTimeDetailed('15:05-1405/07/21');
  assert('پردازش تاریخ و زمان جلالی', 'اتصال مستقیم بدون فاصله (15:05-1405/07/21)', dtNoSpace !== null && dtNoSpace.jalaliDateStr === '1405/07/21', true);

  const dtDateFirst = parseJalaliDateTimeDetailed('1405/07/21 - 15:05');
  assert('پردازش تاریخ و زمان جلالی', 'تاریخ اول سپس ساعت (1405/07/21 - 15:05)', dtDateFirst !== null && dtDateFirst.jalaliDateStr === '1405/07/21' && dtDateFirst.date.getHours() === 15, true);

  const dtInvalid = parseJalaliDateTimeDetailed('متن_کاملا_نامعتبر_تاریخ');
  assert('پردازش تاریخ و زمان جلالی', 'تشخیص مقادیر نامعتبر و بازگرداندن null', dtInvalid === null, true);

  const dtInvalidHour = parseJalaliDateTimeDetailed('29:85 - 1405/07/21');
  assert('پردازش تاریخ و زمان جلالی', 'تشخیص ساعت غیرمجاز (29:85)', dtInvalidHour === null, true);

  return results;
}
