
import { read, utils } from 'xlsx';
import { ReconciledRecord, AnalysisResult, UnmatchedRecord } from '../types';
import {
  getPolicyNumber,
  getStatus,
  getPaymentType,
  getPaymentStatus,
  getNetPayment,
  getInsuredName,
  getCompanyName
} from '../utils/dataExtractors';
import { PAYMENT_TYPE, PAYMENT_STATUS, RECORD_STATUS } from '../constants';

export const processFiles = async (
  bobFile: File,
  commissionFile: File
): Promise<AnalysisResult> => {
  const bobRawData = await readExcelFile(bobFile);
  const commRawData = await readAllSheets(commissionFile);

  const bobPolicyMap = buildBoBPolicyMap(bobRawData);
  const activeBoB = filterActivePolicies(bobRawData);

  const { matchedCommMap, unmatchedCommMap } = processCommissions(
    commRawData,
    bobPolicyMap
  );

  const reconciledRecords = buildReconciledRecords(activeBoB, matchedCommMap);
  const unmatchedRecords = buildUnmatchedRecords(unmatchedCommMap);

  return buildAnalysisResult(reconciledRecords, unmatchedRecords);
};

const readExcelFile = async (file: File): Promise<any[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer);
  const sheetName = workbook.SheetNames[0];
  return utils.sheet_to_json(workbook.Sheets[sheetName]);
};

const readAllSheets = async (file: File): Promise<any[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer);
  let data: any[] = [];
  
  workbook.SheetNames.forEach(sheetName => {
    const sheetData = utils.sheet_to_json(workbook.Sheets[sheetName]);
    data = data.concat(sheetData);
  });
  
  return data;
};

const buildBoBPolicyMap = (bobData: any[]): Map<string, any> => {
  const policyMap = new Map<string, any>();
  
  bobData.forEach(row => {
    const policyNumber = getPolicyNumber(row);
    if (policyNumber) {
      policyMap.set(policyNumber, row);
    }
  });
  
  return policyMap;
};

const filterActivePolicies = (bobData: any[]): any[] =>
  bobData.filter(row => getStatus(row) === RECORD_STATUS.ACTIVE);

const processCommissions = (commData: any[], bobPolicyMap: Map<string, any>) => {
  const matchedCommMap: Record<string, { commissions: number[]; overrides: number[] }> = {};
  const unmatchedCommMap: Record<string, { 
    commissions: number[]; 
    overrides: number[]; 
    name: string; 
    company: string; 
  }> = {};

  commData.forEach(row => {
    const policyNumber = getPolicyNumber(row);
    if (!policyNumber) return;

    const paymentStatus = getPaymentStatus(row);
    if (shouldSkipPayment(paymentStatus)) return;

    const isMatched = bobPolicyMap.has(policyNumber);
    const paymentType = getPaymentType(row);
    const netPayment = getNetPayment(row);

    if (isMatched) {
      addToMatchedMap(matchedCommMap, policyNumber, paymentType, netPayment);
    } else {
      addToUnmatchedMap(
        unmatchedCommMap,
        policyNumber,
        paymentType,
        netPayment,
        row
      );
    }
  });

  return { matchedCommMap, unmatchedCommMap };
};

const shouldSkipPayment = (status: string): boolean =>
  Object.values(PAYMENT_STATUS).includes(status as any);

const addToMatchedMap = (
  map: Record<string, { commissions: number[]; overrides: number[] }>,
  policyNumber: string,
  paymentType: string,
  amount: number
): void => {
  if (!map[policyNumber]) {
    map[policyNumber] = { commissions: [], overrides: [] };
  }

  if (PAYMENT_TYPE.COMMISSION.includes(paymentType)) {
    map[policyNumber].commissions.push(amount);
  } else if (PAYMENT_TYPE.OVERRIDE.includes(paymentType)) {
    map[policyNumber].overrides.push(amount);
  }
};

const addToUnmatchedMap = (
  map: Record<string, any>,
  policyNumber: string,
  paymentType: string,
  amount: number,
  row: any
): void => {
  if (!map[policyNumber]) {
    map[policyNumber] = {
      commissions: [],
      overrides: [],
      name: getInsuredName(row),
      company: getCompanyName(row)
    };
  }

  if (PAYMENT_TYPE.COMMISSION.includes(paymentType)) {
    map[policyNumber].commissions.push(amount);
  } else if (PAYMENT_TYPE.OVERRIDE.includes(paymentType)) {
    map[policyNumber].overrides.push(amount);
  }
};

const buildReconciledRecords = (
  bobData: any[],
  matchedCommMap: Record<string, { commissions: number[]; overrides: number[] }>
): ReconciledRecord[] =>
  bobData.map(bobRow => {
    const policyNumber = getPolicyNumber(bobRow) || 'N/A';
    const commData = matchedCommMap[policyNumber] || { commissions: [], overrides: [] };

    return {
      originalBoB: bobRow,
      policyNumber,
      commissionPayments: commData.commissions,
      overridePayments: commData.overrides,
      commissionTotal: sumArray(commData.commissions),
      overrideTotal: sumArray(commData.overrides),
      netTotal: sumArray(commData.commissions) + sumArray(commData.overrides)
    };
  });

const buildUnmatchedRecords = (
  unmatchedCommMap: Record<string, any>
): UnmatchedRecord[] =>
  Object.entries(unmatchedCommMap).map(([policyNumber, data]) => {
    const commissionTotal = sumArray(data.commissions);
    const overrideTotal = sumArray(data.overrides);

    return {
      policyNumber,
      insuredName: data.name,
      company: data.company,
      commissionPayments: data.commissions,
      overridePayments: data.overrides,
      commissionTotal,
      overrideTotal,
      netTotal: commissionTotal + overrideTotal
    };
  });

const buildAnalysisResult = (
  reconciledRecords: ReconciledRecord[],
  unmatchedRecords: UnmatchedRecord[]
): AnalysisResult => {
  const grandTotalCommission = sumArray(reconciledRecords.map(r => r.commissionTotal));
  const grandTotalOverride = sumArray(reconciledRecords.map(r => r.overrideTotal));
  const grandTotalNet = sumArray(reconciledRecords.map(r => r.netTotal));
  const unmatchedTotalNet = sumArray(unmatchedRecords.map(r => r.netTotal));

  return {
    records: reconciledRecords,
    unmatchedRecords,
    grandTotalCommission,
    grandTotalOverride,
    grandTotalNet,
    unmatchedTotalNet,
    activePoliciesCount: reconciledRecords.length
  };
};

const sumArray = (arr: number[]): number =>
  arr.reduce((sum, val) => sum + val, 0);
