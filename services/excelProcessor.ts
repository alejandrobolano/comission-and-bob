
import { read, utils } from 'xlsx';
import { ReconciledRecord, AnalysisResult, UnmatchedRecord } from '../types';

/**
 * Normaliza claves para manejar espacios o mayúsculas en encabezados de Excel
 */
const normalizeKey = (key: string) => key.trim().toLowerCase();

const findValueByNormalizedKey = (row: any, targets: string[]) => {
  if (!row || typeof row !== 'object') return undefined;
  const keys = Object.keys(row);
  for (const target of targets) {
    const normalizedTarget = normalizeKey(target);
    const foundKey = keys.find(k => normalizeKey(k) === normalizedTarget);
    if (foundKey) return row[foundKey];
  }
  return undefined;
};

export const processFiles = async (
  bobFile: File,
  commissionFile: File
): Promise<AnalysisResult> => {
  // 1. Leer Book of Business (BoB)
  const bobBuffer = await bobFile.arrayBuffer();
  const bobWorkbook = read(bobBuffer);
  const bobSheetName = bobWorkbook.SheetNames[0];
  const bobRawData: any[] = utils.sheet_to_json(bobWorkbook.Sheets[bobSheetName]);

  const bobPolicyMap = new Map<string, any>();
  bobRawData.forEach(row => {
    const policyIdRaw = findValueByNormalizedKey(row, ["Policy Number", "Policy#", "Póliza"]);
    if (policyIdRaw !== undefined && policyIdRaw !== null) {
      bobPolicyMap.set(policyIdRaw.toString().trim(), row);
    }
  });

  // 2. Leer Reporte de Comisiones
  const commBuffer = await commissionFile.arrayBuffer();
  const commWorkbook = read(commBuffer);
  
  let commRawData: any[] = [];
  commWorkbook.SheetNames.forEach(sheetName => {
    const sheetData: any[] = utils.sheet_to_json(commWorkbook.Sheets[sheetName]);
    commRawData = commRawData.concat(sheetData);
  });

  // 3. Filtrar BoB Activos
  const activeBoB = bobRawData.filter(row => {
    const status = findValueByNormalizedKey(row, ["Status", "Estado"]);
    return status?.toString().toLowerCase() === 'active';
  });

  // 4. Agrupar Comisiones
  const matchedCommMap: Record<string, { commissions: number[]; overrides: number[] }> = {};
  const unmatchedCommMap: Record<string, { 
    commissions: number[]; 
    overrides: number[]; 
    name: string; 
    company: string; 
  }> = {};

  commRawData.forEach(row => {
    const policyIdRaw = findValueByNormalizedKey(row, ["Policy Number", "Policy#", "Póliza"]);
    if (policyIdRaw === undefined || policyIdRaw === null) return;
    
    const policyId = policyIdRaw.toString().trim();
    const paymentTypeRaw = findValueByNormalizedKey(row, ["Payment Type", "Tipo de Pago"]);
    const paymentType = paymentTypeRaw?.toString().toLowerCase().trim();
    
    const paymentStatusRaw = findValueByNormalizedKey(row, ["Payment Status", "Estado de Pago"]);
    const paymentStatus = paymentStatusRaw?.toString().toLowerCase().trim();
    
    if (paymentStatusRaw && (paymentStatus === 'pending' || paymentStatus === 'cancelled' || paymentStatus === 'failed')) {
      return; 
    }

    const netPaymentRaw = findValueByNormalizedKey(row, ["Net Payment", "Pago Neto", "Net"]);
    const netPayment = parseFloat(netPaymentRaw) || 0;

    if (!policyId) return;

    const isMatched = bobPolicyMap.has(policyId);
    
    if (isMatched) {
      if (!matchedCommMap[policyId]) matchedCommMap[policyId] = { commissions: [], overrides: [] };
      if (paymentType === 'commission' || paymentType === 'comission' || paymentType === 'comisión') {
        matchedCommMap[policyId].commissions.push(netPayment);
      } else if (paymentType === 'override') {
        matchedCommMap[policyId].overrides.push(netPayment);
      }
    } else {
      if (!unmatchedCommMap[policyId]) {
        unmatchedCommMap[policyId] = { 
          commissions: [], 
          overrides: [], 
          name: findValueByNormalizedKey(row, ["Insured Name", "Insured", "Asegurado", "Customer"])?.toString() || "N/A",
          company: findValueByNormalizedKey(row, ["Company", "Carrier", "Compañía", "Writing Company"])?.toString() || "N/A"
        };
      }
      if (paymentType === 'commission' || paymentType === 'comission' || paymentType === 'comisión') {
        unmatchedCommMap[policyId].commissions.push(netPayment);
      } else if (paymentType === 'override') {
        unmatchedCommMap[policyId].overrides.push(netPayment);
      }
    }
  });

  // 5. Construir Resultados Reconciliados
  const reconciledRecords: ReconciledRecord[] = activeBoB.map(bobRow => {
    const policyNumberRaw = findValueByNormalizedKey(bobRow, ["Policy Number", "Policy#"]);
    const policyNumber = policyNumberRaw?.toString().trim() || "N/A";
    const commData = matchedCommMap[policyNumber] || { commissions: [], overrides: [] };

    return {
      originalBoB: bobRow,
      policyNumber,
      commissionPayments: commData.commissions,
      overridePayments: commData.overrides,
      commissionTotal: commData.commissions.reduce((a, b) => a + b, 0),
      overrideTotal: commData.overrides.reduce((a, b) => a + b, 0),
      netTotal: (commData.commissions.reduce((a, b) => a + b, 0)) + (commData.overrides.reduce((a, b) => a + b, 0))
    };
  });

  // 6. Construir Resultados No Encontrados
  const unmatchedRecords: UnmatchedRecord[] = Object.entries(unmatchedCommMap).map(([policyNumber, data]) => {
    const cTotal = data.commissions.reduce((a, b) => a + b, 0);
    const oTotal = data.overrides.reduce((a, b) => a + b, 0);
    return {
      policyNumber,
      insuredName: data.name,
      company: data.company,
      commissionPayments: data.commissions,
      overridePayments: data.overrides,
      commissionTotal: cTotal,
      overrideTotal: oTotal,
      netTotal: cTotal + oTotal
    };
  });

  return {
    records: reconciledRecords,
    unmatchedRecords,
    grandTotalCommission: reconciledRecords.reduce((acc, curr) => acc + curr.commissionTotal, 0),
    grandTotalOverride: reconciledRecords.reduce((acc, curr) => acc + curr.overrideTotal, 0),
    grandTotalNet: reconciledRecords.reduce((acc, curr) => acc + curr.netTotal, 0),
    unmatchedTotalNet: unmatchedRecords.reduce((acc, curr) => acc + curr.netTotal, 0),
    activePoliciesCount: reconciledRecords.length
  };
};
