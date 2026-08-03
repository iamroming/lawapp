import { startOfYear, endOfYear, addYears, isWithinInterval, format } from "date-fns";

export interface FinancialYear {
  label: string;
  startDate: Date;
  endDate: Date;
}

export function getCurrentFinancialYear(): FinancialYear {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  
  return {
    label: `FY ${year}-${(year + 1).toString().slice(2)}`,
    startDate: new Date(year, 3, 1),
    endDate: new Date(year + 1, 2, 31),
  };
}

export function getFinancialYearForDate(date: Date): FinancialYear {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  
  return {
    label: `FY ${year}-${(year + 1).toString().slice(2)}`,
    startDate: new Date(year, 3, 1),
    endDate: new Date(year + 1, 2, 31),
  };
}

export function isInCurrentFinancialYear(date: Date): boolean {
  const fy = getCurrentFinancialYear();
  return isWithinInterval(date, { start: fy.startDate, end: fy.endDate });
}

export function getFinancialYearDates(fyYear: number): FinancialYear {
  return {
    label: `FY ${fyYear}-${(fyYear + 1).toString().slice(2)}`,
    startDate: new Date(fyYear, 3, 1),
    endDate: new Date(fyYear + 1, 2, 31),
  };
}

export function formatDateInIndianFormat(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

export function getIndianQuarter(date: Date): { quarter: number; label: string; startDate: Date; endDate: Date } {
  const month = date.getMonth();
  const fy = getFinancialYearForDate(date);
  
  if (month >= 3 && month <= 5) {
    return { quarter: 1, label: "Q1 (Apr-Jun)", startDate: new Date(fy.startDate), endDate: new Date(fy.startDate.getFullYear(), 5, 30) };
  } else if (month >= 6 && month <= 8) {
    return { quarter: 2, label: "Q2 (Jul-Sep)", startDate: new Date(fy.startDate.getFullYear(), 6, 1), endDate: new Date(fy.startDate.getFullYear(), 8, 30) };
  } else if (month >= 9 && month <= 11) {
    return { quarter: 3, label: "Q3 (Oct-Dec)", startDate: new Date(fy.startDate.getFullYear(), 9, 1), endDate: new Date(fy.startDate.getFullYear(), 11, 31) };
  } else {
    return { quarter: 4, label: "Q4 (Jan-Mar)", startDate: new Date(fy.startDate.getFullYear() + 1, 0, 1), endDate: new Date(fy.startDate.getFullYear() + 1, 2, 31) };
  }
}
