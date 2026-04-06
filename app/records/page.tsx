"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Record {
  id: string;
  userId: { id?: string; name?: string; email?: string } | string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  userId: "",
  amount: "",
  type: "income",
  category: "",
  date: "",
  description: "",
};

export default function RecordsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);

  const [filters, setFilters] = useState({
    type: "",
    category: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Record | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (appliedFilters.type) params.set("type", appliedFilters.type);
      if (appliedFilters.category)
        params.set("category", appliedFilters.category);
      if (appliedFilters.startDate)
        params.set("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);

      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data.records);
        setPagination(data.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUsers(data.data.users.filter((u: any) => u.role === "viewer"));
          }
        });
    }
  }, [isAdmin]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(r: Record) {
    setEditTarget(r);
    setForm({
      userId: typeof r.userId === "string" ? r.userId : r.userId.id || "",
      amount: String(r.amount),
      type: r.type,
      category: r.category,
      date: r.date.split("T")[0],
      description: r.description || "",
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const payload: { [key: string]: any } = {
        ...form,
        amount: Number(form.amount),
      };
      if (!isAdmin) {
        delete payload.userId;
      } else if (!payload.userId) {
        setFormError("Please select a viewer to assign this record to.");
        setSaving(false);
        return;
      }

      const url = editTarget ? `/api/records/${editTarget.id}` : "/api/records";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setFormError(data.error?.message || "Failed to save record");
      } else {
        setShowModal(false);
        fetchRecords();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    await fetch(`/api/records/${id}`, { method: "DELETE" });
    fetchRecords();
  }

  function handleFilterChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function applyFilters() {
    setPage(1);
    setAppliedFilters(filters);
  }
  function clearFilters() {
    const f = { type: "", category: "", startDate: "", endDate: "" };
    setFilters(f);
    setAppliedFilters(f);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            Financial Records
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {pagination.total} total transactions
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Record
          </button>
        )}
      </div>

      <div className="glass-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative">
            <select
              name="type"
              className="select-field pr-8 text-sm"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <input
            name="category"
            placeholder="Category"
            className="input-field text-sm"
            value={filters.category}
            onChange={handleFilterChange}
          />
          <input
            name="startDate"
            type="date"
            className="input-field text-sm"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <input
            name="endDate"
            type="date"
            className="input-field text-sm"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            className="btn-primary py-1.5 px-4 text-sm"
            onClick={applyFilters}
          >
            Apply
          </button>
          <button
            className="btn-ghost py-1.5 px-4 text-sm"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
                {[
                  "Date",
                  isAdmin ? "User" : "",
                  "Category",
                  "Type",
                  "Amount",
                  "Description",
                  isAdmin ? "Actions" : "",
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(isAdmin ? 7 : 5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{
                            background: "#1e293b",
                            width: j === 2 ? 60 : "80%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 5}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <svg
                      className="w-10 h-10 mx-auto mb-3 opacity-30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-300">
                        {(r.userId as any)?.name ||
                          (r.userId as any)?.email ||
                          "Unknown"}
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {r.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${r.type}`}>{r.type}</span>
                    </td>
                    <td
                      className="px-4 py-3 font-semibold tabular-nums"
                      style={{
                        color: r.type === "income" ? "#34d399" : "#f87171",
                      }}
                    >
                      {r.type === "income" ? "+" : "-"}$
                      {r.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {r.description || "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <span className="text-slate-600">·</span>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "rgba(99,102,241,0.1)" }}
          >
            <span className="text-xs text-slate-400">
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost py-1 px-3 text-xs disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost py-1 px-3 text-xs disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-100">
                {editTarget ? "Edit Record" : "New Record"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="input-field text-sm"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      className="select-field text-sm pr-7"
                      value={form.type}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, type: e.target.value }))
                      }
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <svg
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Assign User
                  </label>
                  <div className="relative">
                    <select
                      className="select-field text-sm pr-7"
                      value={form.userId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, userId: e.target.value }))
                      }
                    >
                      <option value="" disabled>
                        Select a viewer...
                      </option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Salary, Rent, Food…"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Description <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Add a note…"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  className="btn-primary flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editTarget ? "Update" : "Create Record"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
