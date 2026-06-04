/**
 * RUMUS RANCANGAN MATEMATIKA FINANSIAL - WEALTH MANAGER
 * Dioptimalkan untuk eksekusi cepat (<1ms) guna mematuhi batasan 10ms CPU Time Cloudflare Workers.
 */

// 1. SMART BUDGETING (Constraint-Based Redistribution)
// Rumus: dy = -dx * (y / (y + z))
export interface BudgetAllocation {
  savings: number;
  emergency: number;
  pocket: number;
}

export function balanceAllocation(
  oldAlloc: BudgetAllocation,
  changedKey: keyof BudgetAllocation,
  newValue: number
): BudgetAllocation {
  // Clamp nilai baru antara 0 dan 100 sebagai integer bulat
  const clampedNewValue = Math.round(Math.min(100, Math.max(0, newValue)));
  const diff = clampedNewValue - Math.round(oldAlloc[changedKey]);

  if (diff === 0) {
    const rounded = {
      savings: Math.round(oldAlloc.savings),
      emergency: Math.round(oldAlloc.emergency),
      pocket: Math.round(oldAlloc.pocket),
    };
    const total = rounded.savings + rounded.emergency + rounded.pocket;
    if (total !== 100) {
      const keys = Object.keys(oldAlloc) as Array<keyof BudgetAllocation>;
      const remainingKeys = keys.filter((key) => key !== changedKey);
      const adjustKey = rounded[remainingKeys[0]] >= rounded[remainingKeys[1]] ? remainingKeys[0] : remainingKeys[1];
      rounded[adjustKey] = Math.min(100, Math.max(0, rounded[adjustKey] + (100 - total)));
    }
    return rounded;
  }

  const result = {
    savings: Math.round(oldAlloc.savings),
    emergency: Math.round(oldAlloc.emergency),
    pocket: Math.round(oldAlloc.pocket),
  };
  result[changedKey] = clampedNewValue;

  const keys = Object.keys(oldAlloc) as Array<keyof BudgetAllocation>;
  const remainingKeys = keys.filter((key) => key !== changedKey);

  const yKey = remainingKeys[0];
  const zKey = remainingKeys[1];

  const yVal = result[yKey];
  const zVal = result[zKey];
  const totalRemaining = yVal + zVal;

  if (totalRemaining === 0) {
    // Jika kedua kategori lainnya 0, bagi sisa secara merata
    const share = Math.round((100 - clampedNewValue) / 2);
    result[yKey] = share;
    result[zKey] = 100 - clampedNewValue - share;
  } else {
    // Distribusi proporsional mengikuti rumus: dy = -diff * (y / (y + z))
    const newY = Math.round(yVal - diff * (yVal / totalRemaining));
    const newZ = 100 - clampedNewValue - newY;
    result[yKey] = Math.min(100, Math.max(0, newY));
    result[zKey] = Math.min(100, Math.max(0, newZ));
  }

  // Normalisasi akhir untuk memastikan total tepat 100% akibat pembulatan
  const total = result.savings + result.emergency + result.pocket;
  if (total !== 100) {
    const error = 100 - total;
    const adjustKey = result[yKey] >= result[zKey] ? yKey : zKey;
    result[adjustKey] = Math.min(100, Math.max(0, result[adjustKey] + error));
  }

  return result;
}

// 2. LOAN ENGINE (Metode Amortisasi Cicilan)
export interface AmortizationSchedule {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationSchedule[];
}

export function calculateLoan(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  interestType: 'FLAT' | 'EFEKTIF' | 'ANUITAS'
): LoanCalculationResult {
  const i = annualRatePercent / 12 / 100; // Bunga bulanan (desimal)
  const schedule: AmortizationSchedule[] = [];
  let totalInterest = 0;
  let monthlyPayment = 0;

  if (interestType === 'FLAT') {
    // Bunga FLAT: Cicilan = (P + (P * i * t)) / t
    const interestPerMonth = principal * i;
    const principalPerMonth = principal / termMonths;
    monthlyPayment = principalPerMonth + interestPerMonth;

    let remaining = principal;
    for (let m = 1; m <= termMonths; m++) {
      remaining -= principalPerMonth;
      schedule.push({
        month: m,
        payment: monthlyPayment,
        principalPaid: principalPerMonth,
        interestPaid: interestPerMonth,
        remainingPrincipal: Math.max(0, remaining),
      });
      totalInterest += interestPerMonth;
    }
  } else if (interestType === 'EFEKTIF') {
    // Bunga EFEKTIF: Bunga Bulan n = Sisa Pokok Sebelumnya * i
    const principalPerMonth = principal / termMonths;
    let remaining = principal;

    for (let m = 1; m <= termMonths; m++) {
      const interestPaid = remaining * i;
      const payment = principalPerMonth + interestPaid;
      remaining -= principalPerMonth;

      schedule.push({
        month: m,
        payment: payment,
        principalPaid: principalPerMonth,
        interestPaid: interestPaid,
        remainingPrincipal: Math.max(0, remaining),
      });
      totalInterest += interestPaid;
    }
    // Untuk efektif, cicilan bulan pertama dijadikan patokan atau rata-rata (kita catat cicilan bulan pertama sebagai nominal standard)
    monthlyPayment = principal / termMonths + principal * i;
  } else {
    // Bunga ANUITAS: Angsuran = P * (i * (1+i)^n) / ((1+i)^n - 1)
    if (i === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      monthlyPayment = principal * (i * Math.pow(1 + i, termMonths)) / (Math.pow(1 + i, termMonths) - 1);
    }

    let remaining = principal;
    for (let m = 1; m <= termMonths; m++) {
      const interestPaid = remaining * i;
      const principalPaid = monthlyPayment - interestPaid;
      remaining -= principalPaid;

      schedule.push({
        month: m,
        payment: monthlyPayment,
        principalPaid: principalPaid,
        interestPaid: interestPaid,
        remainingPrincipal: Math.max(0, remaining),
      });
      totalInterest += interestPaid;
    }
  }

  // Round values to 2 decimal places
  const round = (num: number) => Math.round(num * 100) / 100;
  
  return {
    monthlyPayment: round(monthlyPayment),
    totalInterest: round(totalInterest),
    totalPayment: round(principal + totalInterest),
    schedule: schedule.map((s) => ({
      month: s.month,
      payment: round(s.payment),
      principalPaid: round(s.principalPaid),
      interestPaid: round(s.interestPaid),
      remainingPrincipal: round(s.remainingPrincipal),
    })),
  };
}

// 3. SISA DANA ALOKASI (SDA)
// Rumus: SDA = Total_Saldo - sum(Tagihan_Cicilan_Aktif_Bulan_Ini)
export function calculateSDA(totalWalletBalance: number, activeMonthlyPaymentsSum: number): number {
  return totalWalletBalance - activeMonthlyPaymentsSum;
}

// 4. BUDGET HEALTH INDEX (Indeks Kesehatan Anggaran)
// Rumus: HealthIndex = max(0, (Budget - Expense) / Budget) * 100%
export function calculateBudgetHealthIndex(totalBudget: number, totalExpense: number): number {
  if (totalBudget <= 0) return 0;
  const rawIndex = (totalBudget - totalExpense) / totalBudget;
  return Math.round(Math.max(0, rawIndex) * 100);
}
