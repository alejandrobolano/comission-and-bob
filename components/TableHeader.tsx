import React from 'react';
import { formatCurrency } from '../utils/formatters';

interface TabsProps {
  matchedCount: number;
  unmatchedCount: number;
  showUnmatched: boolean;
  onTabChange: (showUnmatched: boolean) => void;
}

export const TabsToggle: React.FC<TabsProps> = ({
  matchedCount,
  unmatchedCount,
  showUnmatched,
  onTabChange
}) => (
  <div className="flex items-center bg-slate-200/50 p-1 rounded-lg w-full sm:w-auto">
    <button
      onClick={() => onTabChange(false)}
      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
        !showUnmatched ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      Reconciled ({matchedCount})
    </button>
    <button
      onClick={() => onTabChange(true)}
      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
        showUnmatched ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      Unmatched ({unmatchedCount})
    </button>
  </div>
);

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => (
  <div className="relative flex-1 sm:w-64">
    <input
      type="text"
      placeholder="Search..."
      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
);

interface TableControlsProps {
  matchedCount: number;
  unmatchedCount: number;
  showUnmatched: boolean;
  searchTerm: string;
  onTabChange: (showUnmatched: boolean) => void;
  onSearchChange: (value: string) => void;
  onExportExcel: () => void;
}

export const TableControls: React.FC<TableControlsProps> = ({
  matchedCount,
  unmatchedCount,
  showUnmatched,
  searchTerm,
  onTabChange,
  onSearchChange,
  onExportExcel
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
    <TabsToggle
      matchedCount={matchedCount}
      unmatchedCount={unmatchedCount}
      showUnmatched={showUnmatched}
      onTabChange={onTabChange}
    />
    <div className="flex gap-2 w-full sm:w-auto">
      <button
        onClick={onExportExcel}
        className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
      >
        Export Excel
      </button>
      <SearchInput value={searchTerm} onChange={onSearchChange} />
    </div>
  </div>
);

interface SubtotalsProps {
  commissions: number;
  overrides: number;
  net: number;
}

export const TableSubtotals: React.FC<SubtotalsProps> = ({
  commissions,
  overrides,
  net
}) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-t border-slate-200">
    <div className="text-center">
      <p className="text-[10px] uppercase font-bold text-slate-400">List Commissions</p>
      <p className="text-sm font-bold text-slate-700">{formatCurrency(commissions)}</p>
    </div>
    <div className="text-center">
      <p className="text-[10px] uppercase font-bold text-slate-400">List Overrides</p>
      <p className="text-sm font-bold text-slate-700">{formatCurrency(overrides)}</p>
    </div>
    <div className="text-center">
      <p className="text-[10px] uppercase font-bold text-slate-400">List Net Total</p>
      <p className="text-sm font-black text-blue-600">{formatCurrency(net)}</p>
    </div>
  </div>
);
