
export interface PaymentDetail {
  amount: number;
  date: string | number;
}

export interface BoBRecord {
  [key: string]: any;
  "Policy Number": string | number;
  "Status": string;
}

export interface CommissionRecord {
  [key: string]: any;
  "Policy Number": string | number;
  "Net Payment": string | number;
  "Payment Type": string;
  "Payment Status"?: string;
}

export interface UnmatchedRecord {
  policyNumber: string;
  insuredName: string;
  company: string;
  commissionPayments: number[];
  overridePayments: number[];
  commissionTotal: number;
  overrideTotal: number;
  netTotal: number;
}

export interface ReconciledRecord {
  originalBoB: BoBRecord;
  policyNumber: string;
  commissionPayments: PaymentDetail[];
  overridePayments: PaymentDetail[];
  commissionTotal: number;
  overrideTotal: number;
  netTotal: number;
}

export interface AnalysisResult {
  records: ReconciledRecord[];
  unmatchedRecords: UnmatchedRecord[];
  grandTotalCommission: number;
  grandTotalOverride: number;
  grandTotalNet: number;
  unmatchedTotalNet: number;
  activePoliciesCount: number;
  availableDates?: string[];
}
