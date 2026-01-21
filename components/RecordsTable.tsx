import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { EXCLUDED_BOB_FIELDS, MAX_BOB_FIELD_DISPLAY } from '../constants';
import { normalizeKey } from '../utils/formatters';
import { ReconciledRecord, UnmatchedRecord, PaymentDetail } from '../types';

interface RecordsTableProps {
  records: (ReconciledRecord | UnmatchedRecord)[];
  showUnmatched: boolean;
  searchTerm: string;
}

const getInsuredNameFromBoB = (bob: any): string => {
  const targets = ['insured name', 'insured', 'asegurado', 'customer', 'nombre', 'client name', 'client'];
  const keys = Object.keys(bob);
  const foundKey = keys.find(k => targets.includes(normalizeKey(k)));
  return foundKey ? bob[foundKey] : 'N/A';
};

const RecordTableRow: React.FC<{
  record: ReconciledRecord | UnmatchedRecord;
  showUnmatched: boolean;
}> = ({ record, showUnmatched }) => {
  if (showUnmatched) {
    const unmatchedRecord = record as UnmatchedRecord;
    return (
      <>
        <td className="px-6 py-4 font-bold text-slate-900 text-sm">{unmatchedRecord.policyNumber}</td>
        <td className="px-6 py-4 text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-slate-700">{unmatchedRecord.insuredName}</span>
            <span className="text-slate-400">{unmatchedRecord.company}</span>
          </div>
        </td>
      </>
    );
  }

  const reconciledRecord = record as ReconciledRecord;
  const insuredName = getInsuredNameFromBoB(reconciledRecord.originalBoB);
  const bobFields = Object.entries(reconciledRecord.originalBoB)
    .filter(([k]) => !EXCLUDED_BOB_FIELDS.includes(normalizeKey(k)))
    .slice(0, MAX_BOB_FIELD_DISPLAY);

  return (
    <>
      <td className="px-6 py-4 font-bold text-slate-900 text-sm">{reconciledRecord.policyNumber}</td>
      <td className="px-6 py-4 text-xs">
        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] text-blue-700 font-bold">
            {insuredName}
          </span>
          {bobFields.map(([k, v]) => (
            <span key={k} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">
              <b>{k}:</b> {v?.toString()}
            </span>
          ))}
        </div>
      </td>
    </>
  );
};

const PaymentAmountCell: React.FC<{ payments: PaymentDetail[] }> = ({ payments }) => {
  const sortedPayments = [...payments].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );

  return (
    <td className="px-6 py-4">
      <span className="text-sm font-bold block">
        {formatCurrency(
          sortedPayments.reduce((a, p) => a + (p.amount || 0), 0)
        )}
      </span>

      <div className="flex flex-col gap-1 mt-2">
        {sortedPayments.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100"
          >
            <span className="font-bold whitespace-nowrap">
              {p.date || 'N/A'}
            </span>
            <span className="font-black whitespace-nowrap">
              {formatCurrency(p.amount)}
            </span>
          </div>
        ))}
      </div>
    </td>
  );
};


const OverrideAmountCell: React.FC<{ payments: PaymentDetail[] }> = ({ payments }) => {
  const sortedPayments = [...payments].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '')
  );

  return (
    <td className="px-6 py-4">
      <span className="text-sm font-bold block">
        {formatCurrency(
          sortedPayments.reduce((a, p) => a + (p.amount || 0), 0)
        )}
      </span>

      <div className="flex flex-col gap-1 mt-2">
        {sortedPayments.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100"
          >
            <span className="font-bold whitespace-nowrap">
              {p.date || 'N/A'}
            </span>
            <span className="font-black whitespace-nowrap">
              {formatCurrency(p.amount)}
            </span>
          </div>
        ))}
      </div>
    </td>
  );
};


export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  showUnmatched,
  searchTerm
}) => {
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    
    const lower = searchTerm.toLowerCase();
    return records.filter(r => {
      const policyMatch = r.policyNumber.toLowerCase().includes(lower);
      const nameMatch = showUnmatched && (r as UnmatchedRecord).insuredName.toLowerCase().includes(lower);
      const companyMatch = showUnmatched && (r as UnmatchedRecord).company.toLowerCase().includes(lower);
      const bobMatch = !showUnmatched && (r as ReconciledRecord).originalBoB && 
        Object.values((r as ReconciledRecord).originalBoB).some(val => 
          val?.toString().toLowerCase().includes(lower)
        );
      return policyMatch || bobMatch || nameMatch || companyMatch;
    });
  }, [records, searchTerm, showUnmatched]);

  return (
    <div className="overflow-x-auto max-h-[600px]">
      <table className="w-full text-left border-collapse min-w-max">
        <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
          <tr>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Policy #</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">
              {showUnmatched ? 'Insured / Company' : 'BoB Summary'}
            </th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Commissions</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Overrides</th>
            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Net Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredRecords.map((rec, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <RecordTableRow record={rec} showUnmatched={showUnmatched} />
              <PaymentAmountCell payments={rec.commissionPayments} />
              <OverrideAmountCell payments={rec.overridePayments} />
              <td className="px-6 py-4 text-sm font-black text-blue-700 text-right">
                {formatCurrency(rec.netTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
