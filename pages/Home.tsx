import React, { useState, useMemo } from 'react';
import { utils, writeFile } from 'xlsx';
import { FileUploaderSection } from '../components/FileUploaderSection';
import { ProcessButton } from '../components/ProcessButton';
import { SummaryCard } from '../components/SummaryCard';
import { TableControls, TableSubtotals } from '../components/TableHeader';
import { RecordsTable } from '../components/RecordsTable';
import { processFiles } from '../services/excelProcessor';
import { AnalysisResult } from '../types';
import { formatCurrency, formatFilename } from '../utils/formatters';
import { ERROR_MESSAGES } from '../constants';

const HomePage: React.FC = () => {
  const [bobFile, setBobFile] = useState<File | null>(null);
  const [commFile, setCommFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnmatched, setShowUnmatched] = useState(false);

  const handleProcess = async () => {
    if (!bobFile || !commFile) {
      setError(ERROR_MESSAGES.MISSING_FILES);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await processFiles(bobFile, commFile);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(ERROR_MESSAGES.PROCESS_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const currentRecords = result
    ? (showUnmatched ? result.unmatchedRecords : result.records)
    : [];

  const currentSubtotals = useMemo(() => {
    const filtered = getFilteredRecords(currentRecords, searchTerm, showUnmatched);
    return {
      commissions: filtered.reduce((sum, r) => sum + r.commissionTotal, 0),
      overrides: filtered.reduce((sum, r) => sum + r.overrideTotal, 0),
      net: filtered.reduce((sum, r) => sum + r.netTotal, 0)
    };
  }, [currentRecords, searchTerm, showUnmatched]);

  const handleExportExcel = () => {
    if (!result) return;
    
    const wb = utils.book_new();
    const matchedSheet = buildMatchedSheet(result);
    const unmatchedSheet = buildUnmatchedSheet(result);
    
    utils.book_append_sheet(wb, matchedSheet, 'Conciliadas');
    utils.book_append_sheet(wb, unmatchedSheet, 'No Conciliadas');
    writeFile(wb, formatFilename());
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full">
      <FileUploaderSection
        bobFile={bobFile}
        commFile={commFile}
        onBobFileSelect={setBobFile}
        onCommFileSelect={setCommFile}
      />

      <ProcessButton
        isLoading={loading}
        isDisabled={loading || !bobFile || !commFile}
        onClick={handleProcess}
      />

      {error && <ErrorMessage message={error} />}

      {result && (
        <div className="space-y-6">
          <SummaryCardGrid result={result} />

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <TableControls
                matchedCount={result.records.length}
                unmatchedCount={result.unmatchedRecords.length}
                showUnmatched={showUnmatched}
                searchTerm={searchTerm}
                onTabChange={setShowUnmatched}
                onSearchChange={setSearchTerm}
                onExportExcel={handleExportExcel}
              />

              <TableSubtotals
                commissions={currentSubtotals.commissions}
                overrides={currentSubtotals.overrides}
                net={currentSubtotals.net}
              />
            </div>

            <RecordsTable
              records={currentRecords}
              showUnmatched={showUnmatched}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      )}
    </main>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
    {message}
  </div>
);

const SummaryCardGrid: React.FC<{ result: AnalysisResult }> = ({ result }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <SummaryCard
      label="Pólizas Activas"
      value={result.activePoliciesCount.toString()}
      color="bg-blue-50 text-blue-700"
    />
    <SummaryCard
      label="Neto Conciliado"
      value={formatCurrency(result.grandTotalNet)}
      color="bg-emerald-50 text-emerald-700"
    />
    <SummaryCard
      label="Neto No Conciliado"
      value={formatCurrency(result.unmatchedTotalNet)}
      color="bg-orange-50 text-orange-700"
    />
    <SummaryCard
      label="Total en Archivos"
      value={formatCurrency(result.grandTotalNet + result.unmatchedTotalNet)}
      color="bg-slate-900 text-white"
    />
  </div>
);

const getFilteredRecords = (records: any[], searchTerm: string, showUnmatched: boolean): any[] => {
  if (!searchTerm) return records;
  
  const lower = searchTerm.toLowerCase();
  return records.filter(r => {
    const policyMatch = r.policyNumber.toLowerCase().includes(lower);
    const nameMatch = showUnmatched && r.insuredName?.toLowerCase().includes(lower);
    const companyMatch = showUnmatched && r.company?.toLowerCase().includes(lower);
    const bobMatch = !showUnmatched && r.originalBoB && 
      Object.values(r.originalBoB).some(val => val?.toString().toLowerCase().includes(lower));
    return policyMatch || bobMatch || nameMatch || companyMatch;
  });
};

const buildMatchedSheet = (result: AnalysisResult) => {
  const headers = ['Número de Póliza', 'Nombre del Asegurado', 'Total de Comisiones', 'Total de Bonificaciones', 'Total Neto'];
  const data = [
    headers,
    ...result.records.map(rec => {
      const insuredName = getInsuredNameFromBoB(rec.originalBoB);
      return [
        rec.policyNumber,
        insuredName,
        rec.commissionTotal,
        rec.overrideTotal,
        rec.netTotal
      ];
    })
  ];
  return utils.aoa_to_sheet(data);
};

const buildUnmatchedSheet = (result: AnalysisResult) => {
  const headers = ['Número de Póliza', 'Nombre del Asegurado', 'Empresa', 'Total de Comisiones', 'Total de Bonificaciones', 'Total Neto'];
  const data = [
    headers,
    ...result.unmatchedRecords.map(rec => [
      rec.policyNumber,
      rec.insuredName,
      rec.company,
      rec.commissionTotal,
      rec.overrideTotal,
      rec.netTotal
    ])
  ];
  return utils.aoa_to_sheet(data);
};

const getInsuredNameFromBoB = (bob: any): string => {
  const targets = ['insured name', 'insured', 'asegurado', 'customer', 'nombre', 'client name', 'client', 'full name'];
  const keys = Object.keys(bob);
  const foundKey = keys.find(k => targets.includes(k.trim().toLowerCase()));
  return foundKey ? bob[foundKey] : 'N/A';
};

export default HomePage;
