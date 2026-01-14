import { normalizeKey } from './formatters';

export const findValueByNormalizedKey = (row: any, targets: string[]): any => {
  if (!row || typeof row !== 'object') return undefined;
  
  const keys = Object.keys(row);
  for (const target of targets) {
    const normalizedTarget = normalizeKey(target);
    const foundKey = keys.find(k => normalizeKey(k) === normalizedTarget);
    if (foundKey) return row[foundKey];
  }
  return undefined;
};

export const getInsuredName = (row: any): string => {
  const insured = findValueByNormalizedKey(row, [
    'Insured Name',
    'Insured',
    'Asegurado',
    'Customer',
    'Nombre',
    'Client Name',
    'Client'
  ]);
  return insured?.toString() || 'N/A';
};

export const getCompanyName = (row: any): string => {
  const company = findValueByNormalizedKey(row, [
    'Company',
    'Carrier',
    'Compañía',
    'Writing Company'
  ]);
  return company?.toString() || 'N/A';
};

export const getPolicyNumber = (row: any): string | null => {
  const policyId = findValueByNormalizedKey(row, ['Policy Number', 'Policy#', 'Póliza']);
  return policyId?.toString().trim() || null;
};

export const getPaymentType = (row: any): string => {
  const paymentType = findValueByNormalizedKey(row, ['Payment Type', 'Tipo de Pago']);
  return paymentType?.toString().toLowerCase().trim() || '';
};

export const getPaymentStatus = (row: any): string => {
  const status = findValueByNormalizedKey(row, ['Payment Status', 'Estado de Pago']);
  return status?.toString().toLowerCase().trim() || '';
};

export const getStatus = (row: any): string => {
  const status = findValueByNormalizedKey(row, ['Status', 'Estado']);
  return status?.toString().toLowerCase() || '';
};

export const getNetPayment = (row: any): number => {
  const payment = findValueByNormalizedKey(row, ['Net Payment', 'Pago Neto', 'Net']);
  return parseFloat(payment) || 0;
};
