/**
 * Excel & CSV File Parser and Intelligent Column Mapper
 * Full dataset processing (14,000+ rows) with local client-side sheetjs parsing.
 */

import * as XLSX from 'xlsx';
import {
  CallRecord,
  ColumnMappingConfig,
  ImportValidationResult,
  RejectedRowDetail,
  SystemConfig
} from '../types/telephony';
import {
  parseJalaliDateTimeDetailed,
  parseDurationFlexible,
  getBusinessDayType,
  getIntervalSlot,
  normalizeDigitsToLatin
} from './persianDate';
import {
  OFFICIAL_AGENT_REGISTRY,
  OFFICIAL_AGENTS_LIST,
  resolveAgent,
  UNRESOLVED_AGENT_ID,
  UNRESOLVED_AGENT_NAME,
  isOfficialAgentId
} from './agentRegistry';

/**
 * Common column synonyms for Persian telephony exports
 */
const SYNONYMS = {
  source: ['مبدا تماس', 'مبدا', 'منبع', 'caller', 'source', 'شماره مبدا', 'داخلی مبدا', 'فرستنده'],
  destination: ['مقصد تماس', 'مقصد', 'callee', 'destination', 'شماره مقصد', 'مخاطب', 'مشتری'],
  startTime: ['تاریخ شروع', 'شروع', 'start time', 'start', 'زمان شروع', 'تاریخ و ساعت شروع', 'تاریخ'],
  endTime: ['تاریخ پایان', 'پایان', 'end time', 'end', 'زمان پایان', 'تاریخ و ساعت پایان'],
  callType: ['نوع تماس', 'نوع', 'جهت تماس', 'call type', 'direction', 'ورودی/خروجی'],
  answerStatus: ['وضعیت پاسخ تماس', 'وضعیت پاسخ', 'پاسخ تماس', 'answer status', 'disposition', 'پاسخ'],
  callStatus: ['وضعیت تماس', 'وضعیت', 'call status', 'status', 'نتیجه', 'نتیجه تماس'],
  duration: ['طول تماس', 'مدت مکالمه', 'طول مکالمه', 'duration', 'مدت', 'مدت تماس', 'طول تماس (ثانیه)', 'billsec'],
  queueWait: ['مدت انتظار در صف', 'انتظار در صف', 'queue wait', 'wait time', 'صف'],
  ringDuration: ['مدت زنگ خوردن', 'زنگ خوردن', 'ring duration', 'ring time', 'مدت زنگ'],
};

function matchColumn(availableCols: string[], synonymList: string[]): string {
  for (const col of availableCols) {
    const clean = col.trim().toLowerCase();
    for (const syn of synonymList) {
      if (clean === syn || clean.includes(syn)) {
        return col;
      }
    }
  }
  return '';
}

/**
 * Intelligent guess of column mapping based on file headers
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMappingConfig {
  const sourceCol = matchColumn(headers, SYNONYMS.source) || headers[0] || '';
  const destinationCol = matchColumn(headers, SYNONYMS.destination) || headers[1] || '';
  const startTimeCol = matchColumn(headers, SYNONYMS.startTime) || '';
  const endTimeCol = matchColumn(headers, SYNONYMS.endTime) || '';
  const callTypeCol = matchColumn(headers, SYNONYMS.callType) || '';
  const answerStatusCol = matchColumn(headers, SYNONYMS.answerStatus) || '';
  const callStatusCol = matchColumn(headers, SYNONYMS.callStatus) || '';
  const durationCol = matchColumn(headers, SYNONYMS.duration) || '';
  const queueWaitCol = matchColumn(headers, SYNONYMS.queueWait) || '';
  const ringDurationCol = matchColumn(headers, SYNONYMS.ringDuration) || '';

  return {
    sourceCol,
    destinationCol,
    startTimeCol,
    endTimeCol,
    callTypeCol,
    answerStatusCol,
    callStatusCol,
    durationCol,
    queueWaitCol,
    ringDurationCol,
    agentIdentificationMode: 'source',
    answeredStatusValues: [
      'پاسخ داده شده',
      'پاسخ داده‌شده',
      'موفق',
      'برقرار شده',
      'answered',
      'success',
      'connected'
    ],
    callTypeFilter: 'all'
  };
}

export interface ParsedWorkbookData {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ColumnMappingConfig;
}

/**
 * Filter out completely blank rows that can occur in large Excel sheets
 */
function isRowNonEmpty(row: Record<string, any>): boolean {
  if (!row) return false;
  return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
}

/**
 * Read Excel file (.xlsx, .xls) or CSV file from ArrayBuffer
 * Reads EVERY single row without truncating or limiting row counts.
 */
export function parseRawFile(fileBuffer: ArrayBuffer, fileName: string): ParsedWorkbookData {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  let workbook: XLSX.WorkBook;

  if (isCsv) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(fileBuffer);
    workbook = XLSX.read(text, { type: 'string' });
  } else {
    workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  }

  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetNames[0] || '';
  const worksheet = workbook.Sheets[activeSheet];

  // Convert to JSON with raw header array, preserving all rows
  const allRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const rawRows = allRows.filter(isRowNonEmpty);

  // Get headers from first row keys or sheet range
  let headers: string[] = [];
  if (rawRows.length > 0) {
    headers = Object.keys(rawRows[0]);
  }

  const detectedMapping = autoDetectColumnMapping(headers);

  return {
    workbook,
    sheetNames,
    activeSheet,
    headers,
    rawRows,
    detectedMapping
  };
}

/**
 * Switch worksheet inside an already parsed workbook
 */
export function getSheetData(workbook: XLSX.WorkBook, sheetName: string): { headers: string[]; rawRows: Record<string, any>[] } {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return { headers: [], rawRows: [] };
  const allRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const rawRows = allRows.filter(isRowNonEmpty);
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  return { headers, rawRows };
}

/**
 * Transform raw rows into validated CallRecord objects
 * Processes the ENTIRE dataset (including 14,000+ rows) without artificial limits.
 */
export function transformAndValidateRecords(
  rawRows: Record<string, any>[],
  mapping: ColumnMappingConfig,
  config: SystemConfig,
  fileName: string = 'کاربرگ اکسل',
  sheetName: string = 'Sheet1'
): {
  records: CallRecord[];
  validation: ImportValidationResult;
} {
  const records: CallRecord[] = [];
  const warnings: string[] = [];
  const rejectedDetails: RejectedRowDetail[] = [];
  const detectedAgentsSet = new Set<string>();
  const seenSignatures = new Set<string>();

  let rejectedRowsCount = 0;
  let duplicateRowsCount = 0;
  let ambiguousStatusCount = 0;
  let warningRowsCount = 0;
  let unresolvedCount = 0;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  const answeredSet = new Set(
    mapping.answeredStatusValues.map(v => v.trim().toLowerCase())
  );

  const totalCount = rawRows.length;

  for (let index = 0; index < totalCount; index++) {
    const row = rawRows[index];
    const excelRowNumber = index + 2; // Row 1 is header in Excel

    // 1. Parse Start Time using robust parser
    const rawStart = mapping.startTimeCol ? row[mapping.startTimeCol] : null;
    const parsedStart = parseJalaliDateTimeDetailed(rawStart);

    if (!parsedStart) {
      rejectedRowsCount++;
      rejectedDetails.push({
        rowNumber: excelRowNumber,
        columnName: mapping.startTimeCol || 'تاریخ شروع',
        originalValue: String(rawStart ?? ''),
        reason: 'قالب تاریخ و زمان شروع غیرقابل تشخیص است یا سطر فاقد زمان شروع می‌باشد.'
      });
      continue;
    }

    const startDate = parsedStart.date;
    const dateStr = parsedStart.jalaliDateStr; // e.g. "1405/07/21"

    if (!minDate || dateStr < minDate) minDate = dateStr;
    if (!maxDate || dateStr > maxDate) maxDate = dateStr;

    // Parse End Time if column mapped (non-fatal if unparsable)
    let endDate: Date | undefined = undefined;
    let rawEndStr: string | undefined = undefined;
    if (mapping.endTimeCol && row[mapping.endTimeCol]) {
      rawEndStr = String(row[mapping.endTimeCol]);
      const parsedEnd = parseJalaliDateTimeDetailed(rawEndStr);
      if (parsedEnd) {
        endDate = parsedEnd.date;
      }
    }

    // 2. Identify agent strictly against the official 7 agents registry
    const rawSource = mapping.sourceCol ? String(row[mapping.sourceCol] || '').trim() : '';
    const rawDest = mapping.destinationCol ? String(row[mapping.destinationCol] || '').trim() : '';

    let rawCandidate = '';
    if (mapping.agentIdentificationMode === 'source') {
      rawCandidate = rawSource;
    } else if (mapping.agentIdentificationMode === 'destination') {
      rawCandidate = rawDest;
    } else {
      // Auto-detect: check if source or destination matches one of the 7 official agent IDs
      if (isOfficialAgentId(rawSource)) {
        rawCandidate = rawSource;
      } else if (isOfficialAgentId(rawDest)) {
        rawCandidate = rawDest;
      } else {
        rawCandidate = rawSource || rawDest;
      }
    }

    const resolved = resolveAgent(rawCandidate);
    const agentId = resolved.agentId;
    const agentName = resolved.agentName;

    if (resolved.isOfficial) {
      detectedAgentsSet.add(agentId);
    } else {
      unresolvedCount++;
    }

    // 3. Duration
    const rawDuration = mapping.durationCol ? row[mapping.durationCol] : 0;
    const durationSeconds = parseDurationFlexible(rawDuration);

    // 4. Status analysis
    const rawAnswerStatus = mapping.answerStatusCol ? String(row[mapping.answerStatusCol] || '').trim() : '';
    const rawCallStatus = mapping.callStatusCol ? String(row[mapping.callStatusCol] || '').trim() : '';

    let isSuccessful = false;
    const cleanAnswerStatus = rawAnswerStatus.toLowerCase();

    if (answeredSet.has(cleanAnswerStatus)) {
      isSuccessful = true;
    } else if (
      cleanAnswerStatus.includes('پاسخ داده') || 
      cleanAnswerStatus.includes('موفق') || 
      cleanAnswerStatus.includes('answered') ||
      cleanAnswerStatus.includes('برقرار')
    ) {
      isSuccessful = true;
    } else if (rawCallStatus && (rawCallStatus.toLowerCase().includes('موفق') || rawCallStatus.toLowerCase().includes('برقرار'))) {
      isSuccessful = true;
    } else if (rawAnswerStatus === '' && rawCallStatus === '') {
      ambiguousStatusCount++;
      warningRowsCount++;
      // If duration is non-zero, per rule: "Do not classify a duration-only record as successful without success status"
      isSuccessful = false;
    }

    // 5. Duplicate detection
    const sig = `${startDate.getTime()}_${rawSource}_${rawDest}_${durationSeconds}`;
    if (seenSignatures.has(sig)) {
      duplicateRowsCount++;
      if (config.deduplicateRecords) {
        continue; // skip duplicate row
      }
    }
    seenSignatures.add(sig);

    // 6. Day type and interval slot
    const dayType = getBusinessDayType(startDate);
    const intervalSlot = getIntervalSlot(startDate, dayType);

    // 7. Call type
    const rawType = mapping.callTypeCol ? String(row[mapping.callTypeCol] || '').trim().toLowerCase() : '';
    let callType: CallRecord['callType'] = 'unknown';
    if (rawType.includes('خروج') || rawType.includes('outbound')) callType = 'outbound';
    else if (rawType.includes('ورود') || rawType.includes('inbound')) callType = 'inbound';
    else if (rawType.includes('داخل') || rawType.includes('internal')) callType = 'internal';

    // 8. Eligibility
    let isEligible = true;
    if (mapping.callTypeFilter === 'outbound_only' && callType === 'inbound') isEligible = false;
    if (mapping.callTypeFilter === 'inbound_only' && callType === 'outbound') isEligible = false;

    // Optional fields
    const queueWait = mapping.queueWaitCol ? parseDurationFlexible(row[mapping.queueWaitCol]) : undefined;
    const ringDur = mapping.ringDurationCol ? parseDurationFlexible(row[mapping.ringDurationCol]) : undefined;

    records.push({
      id: `call_${excelRowNumber}_${index}`,
      source: rawSource,
      destination: rawDest,
      startTime: startDate,
      endTime: endDate,
      callType,
      answerStatus: isSuccessful 
        ? 'answered' 
        : (cleanAnswerStatus.includes('بی') || cleanAnswerStatus.includes('عدم') ? 'no_answer' : 'unknown'),
      callStatus: isSuccessful ? 'successful' : 'unsuccessful',
      durationSeconds,
      queueWaitSeconds: queueWait,
      ringDurationSeconds: ringDur,
      agentId,
      agentName,
      isEligible,
      isSuccessful,
      intervalSlot,
      dateStr,
      dayType,
      rawStartTime: parsedStart.rawString,
      rawEndTime: rawEndStr,
      jalaliDateStr: dateStr,
      rowNumber: excelRowNumber
    });
  }

  if (ambiguousStatusCount > 0) {
    warnings.push(`${ambiguousStatusCount} رکورد فاقد وضعیت پاسخ صریح بودند و بر اساس ضوابط ایمن، بدون پاسخ لحاظ شدند.`);
  }

  if (duplicateRowsCount > 0 && config.deduplicateRecords) {
    warnings.push(`${duplicateRowsCount} سطر تکراری همزمان شناسایی و طبق تنظیمات سامانه حذف شدند.`);
  }

  if (rejectedRowsCount > 0) {
    warnings.push(`${rejectedRowsCount} سطر به دلیل عدم تطابق تاریخ یا خالی بودن فیلدهای حیاتی رد شدند. گزارش خطاها قابل دانلود است.`);
  }

  if (unresolvedCount > 0) {
    warnings.push(`${unresolvedCount} تماس فاقد شناسه کارشناس معتبر از میان ۷ کارشناس مجاز بودند و با عنوان «${UNRESOLVED_AGENT_NAME}» علامت‌گذاری شدند.`);
  }

  const sampleRows = rawRows.slice(0, 50); // Preview up to 50 rows in UI for snappy responsiveness
  const detectedAgents = Array.from(detectedAgentsSet);

  const validation: ImportValidationResult = {
    fileName,
    sheetName,
    totalRawRows: rawRows.length,
    validRecordsCount: records.length,
    warningRecordsCount: warningRowsCount,
    rejectedRowsCount,
    duplicateRowsCount,
    ambiguousStatusCount,
    unresolvedRecordsCount: unresolvedCount,
    availableColumns: rawRows.length > 0 ? Object.keys(rawRows[0]) : [],
    sampleRows,
    warnings,
    rejectedDetails,
    detectedAgents,
    dateRangeDetected: minDate && maxDate ? { minDate, maxDate } : null
  };

  return { records, validation };
}
