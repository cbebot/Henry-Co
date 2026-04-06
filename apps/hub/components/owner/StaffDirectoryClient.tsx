"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
type Row = {
  id: string;
  fullName: string;
  email: string | null;
  division: string | null;
  role: string;
  status: string;
  lastSeen: string | null;
};

export function StaffDirectoryClient({
  members,
  divisionLabels,
}: {
  members: Row[];
  divisionLabels: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [division, setDivision] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (division !== "all" && (m.division || "unassigned") !== division) return false;
      if (status !== "all" && m.status !== status) return false;
      if (!needle) return true;
      const blob = `${m.fullName} ${m.email || ""} ${m.role} ${m.division || ""}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [members, q, division, status]);

  const divisions = useMemo(() => {
    const s = new Set<string>();
    for (const m of members) {
      s.add(m.division || "unassigned");
    }
    return [...s].sort();
  }, [members]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--acct-muted)]">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, role, division…"
            className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
          />
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold text-[var(--acct-muted)]">
          Division
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          >
            <option value="all">All divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d === "unassigned" ? "Unassigned" : divisionLabels[d] || d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[140px] flex-col gap-1 text-xs font-semibold text-[var(--acct-muted)]">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)]"
          >
            <option value="all">Any</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-[var(--acct-muted)]">
        Showing {filtered.length} of {members.length} members
      </p>

      <div className="overflow-x-auto rounded-[1.25rem] border border-[var(--acct-line)]">
        <table className="owner-table w-full min-w-[640px]">
          <thead>
            <tr>
              <th>Person</th>
              <th>Division</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="font-medium text-[var(--acct-ink)]">{m.fullName}</div>
                  <div className="text-xs text-[var(--acct-muted)]">{m.email || "—"}</div>
                </td>
                <td className="text-sm">{m.division ? divisionLabels[m.division] || m.division : "—"}</td>
                <td className="text-sm capitalize text-[var(--acct-muted)]">{m.role.replace(/_/g, " ")}</td>
                <td className="text-sm capitalize">{m.status}</td>
                <td className="text-right">
                  <Link href={`/owner/staff/users/${m.id}`} className="acct-button-secondary inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold">
                    Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
