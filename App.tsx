
import React, { useState, useMemo } from 'react';
import { utils, writeFile } from 'xlsx';
import FileUploader from './components/FileUploader';
import { processFiles } from './services/excelProcessor';
import { AnalysisResult, ReconciledRecord, UnmatchedRecord } from './types';

const App: React.FC = () => {
  const [bobFile, setBobFile] = useState<File | null>(null);
  const [commFile, setCommFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnmatched, setShowUnmatched] = useState(false);

  const handleProcess = async () => {
    if (!bobFile || !commFile) {
      setError("Please select both Book of Business and Commission Report files.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await processFiles(bobFile, commFile);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to process files. Ensure headers like 'Policy Number', 'Status', 'Net Payment', and 'Payment Type' exist.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!result) return [];
    const base = showUnmatched ? result.unmatchedRecords : result.records;
    if (!searchTerm) return base;
    const lower = searchTerm.toLowerCase();
    
    return base.filter(r => {
      const policyMatch = r.policyNumber.toLowerCase().includes(lower);
      const nameMatch = showUnmatched && (r as UnmatchedRecord).insuredName.toLowerCase().includes(lower);
      const companyMatch = showUnmatched && (r as UnmatchedRecord).company.toLowerCase().includes(lower);
      const bobMatch = !showUnmatched && (r as ReconciledRecord).originalBoB && Object.values((r as ReconciledRecord).originalBoB).some(val => 
        val?.toString().toLowerCase().includes(lower)
      );
      return policyMatch || bobMatch || nameMatch || companyMatch;
    });
  }, [result, searchTerm, showUnmatched]);

  const currentSubtotals = useMemo(() => {
    return filteredRecords.reduce((acc, curr) => {
      acc.commissions += curr.commissionTotal;
      acc.overrides += curr.overrideTotal;
      acc.net += curr.netTotal;
      return acc;
    }, { commissions: 0, overrides: 0, net: 0 });
  }, [filteredRecords]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const normalizeKey = (key: string) => key.trim().toLowerCase();

  const findInsuredInBoB = (bob: any) => {
    const targets = ["insured name", "insured", "asegurado", "customer", "nombre", "client name", "client"];
    const keys = Object.keys(bob);
    const foundKey = keys.find(k => targets.includes(normalizeKey(k)));
    return foundKey ? bob[foundKey] : "N/A";
  };

  const handleExportExcel = () => {
    if (!result) return;
    const wb = utils.book_new();

    // 1. Matched Sheet
    // We want to include Policy Number, Insured Name, and totals. 
    // We can also include other BoB fields if needed, but the requirement is "nombre de la persona".
    const matchedHeaders = ["Policy Number", "Insured Name", "Commission Total", "Override Total", "Net Total"];
    const matchedData = [
      matchedHeaders, 
      ...result.records.map(rec => [
        rec.policyNumber, 
        findInsuredInBoB(rec.originalBoB),
        rec.commissionTotal, 
        rec.overrideTotal, 
        rec.netTotal
      ])
    ];
    const wsMatched = utils.aoa_to_sheet(matchedData);
    utils.book_append_sheet(wb, wsMatched, "Reconciled");

    // 2. Unmatched Sheet
    const unmatchedHeaders = ["Policy Number", "Insured Name", "Company", "Commission Total", "Override Total", "Net Total"];
    const unmatchedData = [
      unmatchedHeaders, 
      ...result.unmatchedRecords.map(rec => [
        rec.policyNumber, 
        rec.insuredName, 
        rec.company, 
        rec.commissionTotal, 
        rec.overrideTotal, 
        rec.netTotal
      ])
    ];
    const wsUnmatched = utils.aoa_to_sheet(unmatchedData);
    utils.book_append_sheet(wb, wsUnmatched, "Unmatched");

    writeFile(wb, `commission_audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Commission Auditor</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploader id="bob" label="1. Book of Business (Source)" onFileSelect={setBobFile} selectedFile={bobFile} />
          <FileUploader id="comm" label="2. Commission Report (Target)" onFileSelect={setCommFile} selectedFile={commFile} />
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={handleProcess}
            disabled={loading || !bobFile || !commFile}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg
              ${loading || !bobFile || !commFile ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Processing..." : "Run Reconciliation"}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Active Policies" value={result.activePoliciesCount.toString()} color="bg-blue-50 text-blue-700" />
              <SummaryCard label="Matched Net" value={formatCurrency(result.grandTotalNet)} color="bg-emerald-50 text-emerald-700" />
              <SummaryCard label="Unmatched Net" value={formatCurrency(result.unmatchedTotalNet)} color="bg-orange-50 text-orange-700" />
              <SummaryCard label="Total in Files" value={formatCurrency(result.grandTotalNet + result.unmatchedTotalNet)} color="bg-slate-900 text-white" />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center bg-slate-200/50 p-1 rounded-lg w-full sm:w-auto">
                    <button 
                      onClick={() => setShowUnmatched(false)}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!showUnmatched ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Reconciled ({result.records.length})
                    </button>
                    <button 
                      onClick={() => setShowUnmatched(true)}
                      className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${showUnmatched ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Unmatched ({result.unmatchedRecords.length})
                    </button>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleExportExcel} className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">Export Excel</button>
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">List Commissions</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(currentSubtotals.commissions)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">List Overrides</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(currentSubtotals.overrides)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">List Net Total</p>
                    <p className="text-sm font-black text-blue-600">{formatCurrency(currentSubtotals.net)}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Policy #</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">{showUnmatched ? "Insured / Company" : "BoB Summary"}</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Commissions</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Overrides</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">{rec.policyNumber}</td>
                        <td className="px-6 py-4 text-xs">
                          {showUnmatched ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{(rec as UnmatchedRecord).insuredName}</span>
                              <span className="text-slate-400">{(rec as UnmatchedRecord).company}</span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {/* Also show insured name in BoB summary if available */}
                              <span className="bg-blue-50 px-1.5 py-0.5 rounded text-[10px] text-blue-700 font-bold">
                                {findInsuredInBoB((rec as ReconciledRecord).originalBoB)}
                              </span>
                              {Object.entries((rec as ReconciledRecord).originalBoB)
                                .filter(([k]) => !["insured name", "insured", "asegurado", "customer", "nombre", "policy number", "status"].includes(normalizeKey(k)))
                                .slice(0, 2).map(([k, v]) => (
                                <span key={k} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">
                                  <b>{k}:</b> {v?.toString()}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold block">{formatCurrency(rec.commissionTotal)}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.commissionPayments.map((p, i) => <span key={i} className="text-[9px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100">{formatCurrency(p)}</span>)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold block">{formatCurrency(rec.overrideTotal)}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.overridePayments.map((p, i) => <span key={i} className="text-[9px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100">{formatCurrency(p)}</span>)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-blue-700 text-right">{formatCurrency(rec.netTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SummaryCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className={`${color} p-5 rounded-xl shadow-sm border border-black/5`}>
    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
    <p className="text-xl font-black">{value}</p>
  </div>
);

export default App;
