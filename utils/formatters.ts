export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const normalizeKey = (key: string): string =>
  key.trim().toLowerCase();

export const formatFilename = (prefix: string = 'commission_audit'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.xlsx`;
};
