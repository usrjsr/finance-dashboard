"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
  status: "active" | "inactive";
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "viewer" as const,
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "viewer" as User["role"],
    status: "active" as User["status"],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (session?.user?.role === "admin") fetchUsers();
  }, [fetchUsers, session]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({ name: u.name, role: u.role, status: u.status });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await fetch(`/api/users/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error?.message || "Failed to update");
          return;
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error?.message || "Failed to create user");
          return;
        }
      }
      setShowModal(false);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (
      !confirm("Deactivate this user? They will no longer be able to log in.")
    )
      return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  }

  if (status === "loading") return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pagination.total} registered users
          </p>
        </div>
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
          Add User
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="h-4 rounded animate-pulse"
                          style={{
                            background: "#1e293b",
                            width: j === 1 ? "90%" : "70%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0"
                          style={{ background: "rgba(99,102,241,0.15)" }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-${u.role}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${u.status}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        {u.id !== session?.user?.id &&
                          u.status === "active" && (
                            <>
                              <span className="text-slate-600">·</span>
                              <button
                                onClick={() => handleDeactivate(u.id)}
                                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                              >
                                Deactivate
                              </button>
                            </>
                          )}
                      </div>
                    </td>
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
                {editTarget ? "Edit User" : "New User"}
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
              {editTarget ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Role
                      </label>
                      <div className="relative">
                        <select
                          className="select-field text-sm pr-7"
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              role: e.target.value as User["role"],
                            }))
                          }
                        >
                          <option value="viewer">Viewer</option>
                          <option value="analyst">Analyst</option>
                          <option value="admin">Admin</option>
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
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          className="select-field text-sm pr-7"
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              status: e.target.value as User["status"],
                            }))
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
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
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input-field text-sm"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      className="input-field text-sm"
                      placeholder="min. 6 characters"
                      value={form.password}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, password: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        className="select-field text-sm pr-7"
                        value={form.role}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            role: e.target.value as typeof form.role,
                          }))
                        }
                      >
                        <option value="viewer">Viewer</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
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
                </>
              )}
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
                  {saving
                    ? "Saving…"
                    : editTarget
                      ? "Update User"
                      : "Create User"}
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
