import { type Expense, type ExpenseCategory, EXPENSE_CATEGORIES } from "@/lib/db";

export interface CategoryTotal {
  category: ExpenseCategory;
  label: string;
  icon: string;
  amount: number;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  amount: number;
  categories: CategoryTotal[];
}

export interface ExpenseStats {
  seasonTotal: number;
  categoryTotals: CategoryTotal[];
  monthlyTotals: MonthlyTotal[];
}

export function computeExpenseStats(expenses: Expense[], seasonYear = 2026): ExpenseStats {
  const seasonExpenses = expenses.filter((e) => {
    const parts = e.date.split(".");
    if (parts.length !== 3) return false;
    return parseInt(parts[0]) === seasonYear;
  });

  // Category totals
  const catMap = new Map<ExpenseCategory, number>();
  for (const e of seasonExpenses) {
    const cat = e.category as ExpenseCategory;
    catMap.set(cat, (catMap.get(cat) || 0) + e.amount);
  }
  const categoryTotals: CategoryTotal[] = Array.from(catMap.entries())
    .map(([cat, amount]) => {
      const info = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
      return { category: cat, label: info.label, icon: info.icon, amount };
    })
    .sort((a, b) => b.amount - a.amount);

  const seasonTotal = categoryTotals.reduce((sum, c) => sum + c.amount, 0);

  // Monthly breakdown
  const monthMap = new Map<string, { amount: number; catMap: Map<ExpenseCategory, number> }>();
  for (const e of seasonExpenses) {
    const parts = e.date.split(".");
    if (parts.length !== 3) continue;
    const key = `${parts[0]}-${parts[1]}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, { amount: 0, catMap: new Map() });
    }
    const m = monthMap.get(key)!;
    m.amount += e.amount;
    const cat = e.category as ExpenseCategory;
    m.catMap.set(cat, (m.catMap.get(cat) || 0) + e.amount);
  }

  const monthlyTotals: MonthlyTotal[] = Array.from(monthMap.entries())
    .map(([key, data]) => {
      const [y, m] = key.split("-").map(Number);
      const categories: CategoryTotal[] = Array.from(data.catMap.entries())
        .map(([cat, amount]) => {
          const info = EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other;
          return { category: cat, label: info.label, icon: info.icon, amount };
        })
        .sort((a, b) => b.amount - a.amount);
      return { year: y, month: m, amount: data.amount, categories };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);

  return { seasonTotal, categoryTotals, monthlyTotals };
}

/** Get daily totals for a month (for calendar display) */
export function getDailyTotals(expenses: Expense[]): Map<number, number> {
  const totals = new Map<number, number>();
  for (const e of expenses) {
    const parts = e.date.split(".");
    if (parts.length < 3) continue;
    const day = parseInt(parts[2]);
    if (isNaN(day)) continue;
    totals.set(day, (totals.get(day) || 0) + e.amount);
  }
  return totals;
}

/** Get category icons for a set of expenses, sorted by amount descending */
export function getCategoryIcons(expenses: Expense[]): { icon: string; amount: number }[] {
  const catMap = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    const cat = e.category as ExpenseCategory;
    catMap.set(cat, (catMap.get(cat) || 0) + e.amount);
  }
  return Array.from(catMap.entries())
    .map(([cat, amount]) => ({ icon: (EXPENSE_CATEGORIES[cat] || EXPENSE_CATEGORIES.other).icon, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString()}`;
}
