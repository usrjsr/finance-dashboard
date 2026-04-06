"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
}
interface TrendItem {
  year: number;
  month: number;
  income: number;
  expenses: number;
  net: number;
}
interface CategoryItem {
  category: string;
  totalIncome: number;
  totalExpenses: number;
  count: number;
}
interface RecentRecord {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  description?: string;
}

function StatCard({ label, value, icon, color, subLabel }: { label: string; value: string; icon: React.ReactNode; color: string; subLabel?: string }) {
  return (
    <div className="glass-card p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-50 mt-0.5 truncate">{value}</p>
        {subLabel && <p className="text-xs text-slate-500 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewAnalytics = session?.user?.role === "admin" || session?.user?.role === "analyst";
  //console.log(canViewAnalytics, session?.user?.role)

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      try {
        if (canViewAnalytics) {
          const [s, t, c, r] = await Promise.all([
            fetch("/api/dashboard/summary").then((res) => res.json()),
            fetch("/api/dashboard/trends").then((res) => res.json()),
            fetch("/api/dashboard/categories").then((res) => res.json()),
            fetch("/api/dashboard/recent").then((res) => res.json()),
          ]);
          if (s.success) setSummary(s.data);
          if (t.success) setTrends(t.data.trends);
          if (c.success) setCategories(c.data.categories.slice(0, 6));
          if (r.success) setRecent(r.data.records);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session, canViewAnalytics]);

  const trendData = trends.map((t) => ({ name: `${MONTH_NAMES[t.month - 1]} ${t.year}`, Income: t.income, Expenses: t.expenses }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "#1e293b" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#1e293b" }} />)}
        </div>
        <div className="h-72 rounded-2xl animate-pulse" style={{ background: "#1e293b" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome back, <span className="text-slate-200 font-medium">{session?.user?.name}</span>
        </p>
      </div>

      {canViewAnalytics && summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Income"
              value={fmt(summary.totalIncome)}
              color="rgba(16,185,129,0.2)"
              subLabel="All time"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
            />
            <StatCard
              label="Total Expenses"
              value={fmt(summary.totalExpenses)}
              color="rgba(239,68,68,0.2)"
              subLabel="All time"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>}
            />
            <StatCard
              label="Net Balance"
              value={fmt(summary.netBalance)}
              color={summary.netBalance >= 0 ? "rgba(99,102,241,0.2)" : "rgba(239,68,68,0.2)"}
              subLabel={summary.netBalance >= 0 ? "Surplus" : "Deficit"}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
            />
            <StatCard
              label="Total Records"
              value={summary.totalRecords.toString()}
              color="rgba(139,92,246,0.2)"
              subLabel="Transactions"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            />
          </div>

          {trendData.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Revenue vs Expenses — Last 12 Months</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.5rem", fontSize: "13px", color: "#f8fafc" }}
                    formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={2} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#f87171" strokeWidth={2} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.length > 0 && (
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Spending by Category</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categories} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                    <XAxis dataKey="category" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.5rem", fontSize: "13px", color: "#f8fafc" }}
                      formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="totalIncome" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalExpenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {recent.length > 0 && (
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Transactions</h2>
                <div className="space-y-2">
                  {recent.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "rgba(99,102,241,0.08)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.type === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.type === "income" ? "#34d399" : "#f87171"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {r.type === "income"
                              ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
                              : <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>
                            }
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{r.category}</p>
                          <p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold ml-2 shrink-0" style={{ color: r.type === "income" ? "#34d399" : "#f87171" }}>
                        {r.type === "income" ? "+" : "-"}${r.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass-card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(99,102,241,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200">Viewer Access</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Analytics are available for Analyst and Admin roles. Visit <a href="/records" className="text-indigo-400 hover:underline">Records</a> to view your transactions.
          </p>
        </div>
      )}
    </div>
  );
}
