"use client";

import { Database, Flag, KeyRound, LogOut, RotateCcw, Search, Shield, ShieldOff, UserCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdminUser = {
  id: string;
  username: string;
};

type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  language: string;
  avatarUrl: string | null;
  description: string | null;
  birthDate: string;
  ipAddress: string | null;
  ipLocation: string | null;
  invalidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
    comments: number;
    followers: number;
    following: number;
  };
};

type BackupInfo = {
  path: string;
  createdAt: string;
  size: number;
};

type ReportedContent = {
  id: string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    displayName: string;
    username: string;
  };
  target: null | {
    type: "post" | "comment";
    id: string;
    postId?: string;
    body: string;
    createdAt: string;
    deletedAt: string | null;
    author: {
      id: string;
      displayName: string;
      username: string;
      invalidatedAt: string | null;
    };
  };
};

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<{ user: string; password: string } | null>(null);
  const [backup, setBackup] = useState<BackupInfo | null>(null);
  const [reports, setReports] = useState<ReportedContent[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const invalidatedCount = useMemo(() => users.filter((user) => user.invalidatedAt).length, [users]);

  useEffect(() => {
    async function loadAdmin() {
      const response = await fetch("/api/admin/auth/me");
      const data = (await response.json().catch(() => null)) as { admin?: AdminUser | null } | null;
      const currentAdmin = data?.admin ?? null;

      setAdmin(currentAdmin);
      setLoading(false);

      if (currentAdmin) {
        loadUsers();
        loadBackupInfo();
        loadReports();
      }
    }

    loadAdmin();
  }, []);

  async function loadUsers(nextQuery = query) {
    const search = nextQuery.trim();
    const response = await fetch(search ? `/api/admin/users?q=${encodeURIComponent(search)}` : "/api/admin/users");
    const data = (await response.json().catch(() => null)) as { users?: ManagedUser[]; error?: string } | null;

    if (!response.ok || !data?.users) {
      setNotice(data?.error ?? "Could not load users");
      return;
    }

    setUsers(data.users);
  }

  async function loadBackupInfo() {
    const response = await fetch("/api/admin/database-backup");
    const data = (await response.json().catch(() => null)) as { backup?: BackupInfo | null; error?: string } | null;

    if (!response.ok) {
      setNotice(data?.error ?? "Could not load backup info");
      return;
    }

    setBackup(data?.backup ?? null);
  }

  async function loadReports() {
    const response = await fetch("/api/admin/reports");
    const data = (await response.json().catch(() => null)) as { reports?: ReportedContent[]; error?: string } | null;

    if (!response.ok || !data?.reports) {
      setNotice(data?.error ?? "Could not load reported content");
      return;
    }

    setReports(data.reports);
  }

  async function submitLogin() {
    setNotice("");
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await response.json().catch(() => null)) as { admin?: AdminUser; error?: string } | null;

    if (!response.ok || !data?.admin) {
      setNotice(data?.error ?? "Login failed");
      return;
    }

    setAdmin(data.admin);
    setPassword("");
    await loadUsers("");
    await loadBackupInfo();
    await loadReports();
  }

  async function submitLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAdmin(null);
    setUsers([]);
    setReports([]);
    setGeneratedPassword(null);
    setBackup(null);
  }

  async function createDatabaseBackup() {
    setBackingUp(true);
    setNotice("");
    const response = await fetch("/api/admin/database-backup", { method: "POST" });
    const data = (await response.json().catch(() => null)) as { backup?: BackupInfo; error?: string } | null;
    setBackingUp(false);

    if (!response.ok || !data?.backup) {
      setNotice(data?.error ?? "Database backup failed");
      return;
    }

    setBackup(data.backup);
    setNotice("Database backup completed");
  }

  async function resetPassword(user: ManagedUser) {
    setBusyUserId(user.id);
    setNotice("");
    const response = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { initialPassword?: string; error?: string } | null;
    setBusyUserId(null);

    if (!response.ok || !data?.initialPassword) {
      setNotice(data?.error ?? "Password reset failed");
      return;
    }

    setGeneratedPassword({ user: `@${user.username}`, password: data.initialPassword });
  }

  async function toggleInvalidation(user: ManagedUser) {
    setBusyUserId(user.id);
    setNotice("");
    const response = await fetch(`/api/admin/users/${user.id}/invalidation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalidated: !user.invalidatedAt }),
    });
    const data = (await response.json().catch(() => null)) as {
      user?: { id: string; invalidatedAt: string | null };
      error?: string;
    } | null;
    setBusyUserId(null);

    if (!response.ok || !data?.user) {
      setNotice(data?.error ?? "Status update failed");
      return;
    }

    setUsers((items) =>
      items.map((item) => (item.id === user.id ? { ...item, invalidatedAt: data.user!.invalidatedAt } : item)),
    );
  }

  async function changeAdminPassword() {
    setNotice("");
    const response = await fetch("/api/admin/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, nextPassword }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setNotice(data?.error ?? "Password change failed");
      return;
    }

    setCurrentPassword("");
    setNextPassword("");
    setNotice("Admin password updated");
  }

  async function handleReportAction(report: ReportedContent, action: "hide" | "invalidate" | "review") {
    setBusyReportId(report.id);
    setNotice("");
    const response = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusyReportId(null);

    if (!response.ok) {
      setNotice(data?.error ?? "Report action failed");
      return;
    }

    await Promise.all([loadReports(), action === "invalidate" ? loadUsers() : Promise.resolve()]);
    setNotice("Report updated");
  }

  if (loading) {
    return <main className="admin-shell">Loading...</main>;
  }

  if (!admin) {
    return (
      <main className="admin-shell login-admin">
        <section className="admin-login-panel">
          <div className="admin-brand">
            <Shield size={34} />
            <div>
              <h1>deepSea Admin</h1>
              <p>Management console</p>
            </div>
          </div>
          {notice ? <p className="admin-notice">{notice}</p> : null}
          <label className="admin-field">
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitLogin();
                }
              }}
            />
          </label>
          <button className="admin-primary-button" type="button" onClick={submitLogin}>
            Log in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <Shield size={32} />
          <div>
            <h1>deepSea Admin</h1>
            <p>{admin.username}</p>
          </div>
        </div>
        <button className="admin-ghost-button" type="button" onClick={submitLogout}>
          <LogOut size={18} />
          Log out
        </button>
      </header>

      <section className="admin-metrics" aria-label="Admin metrics">
        <div>
          <span>Total users</span>
          <strong>{users.length}</strong>
        </div>
        <div>
          <span>Invalidated</span>
          <strong>{invalidatedCount}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{users.length - invalidatedCount}</strong>
        </div>
        <div>
          <span>Open reports</span>
          <strong>{reports.filter((report) => !report.reviewedAt).length}</strong>
        </div>
      </section>

      <section className="admin-panel admin-backup-panel">
        <div className="admin-panel-heading">
          <Database size={20} />
          <h2>Database Backup</h2>
        </div>
        <div className="admin-backup-content">
          <div>
            <span>Last backup time</span>
            <strong>{backup ? formatDateTime(backup.createdAt) : "No backup yet"}</strong>
          </div>
          <div>
            <span>Backup file path</span>
            <strong className="admin-backup-path">{backup?.path ?? "No backup file"}</strong>
          </div>
          <button className="admin-primary-button" type="button" onClick={createDatabaseBackup} disabled={backingUp}>
            <Database size={18} />
            {backingUp ? "Backing up..." : "备份数据库"}
          </button>
        </div>
      </section>

      <section className="admin-toolbar">
        <label className="admin-search">
          <Search size={18} />
          <input
            value={query}
            placeholder="Search email, display name, handle"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                loadUsers();
              }
            }}
          />
        </label>
        <button className="admin-secondary-button" type="button" onClick={() => loadUsers()}>
          Search
        </button>
      </section>

      {notice ? <p className="admin-notice">{notice}</p> : null}
      {generatedPassword ? (
        <section className="admin-password-result">
          <KeyRound size={20} />
          <span>{generatedPassword.user}</span>
          <strong>{generatedPassword.password}</strong>
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <Flag size={20} />
          <h2>Reported Content</h2>
        </div>
        {reports.length === 0 ? <p className="admin-empty">No reports yet</p> : null}
        {reports.length > 0 ? (
          <div className="admin-report-list">
            {reports.map((report) => (
              <article className="admin-report-card" key={report.id}>
                <div className="admin-report-main">
                  <div>
                    <span className={report.reviewedAt ? "admin-status" : "admin-status invalid"}>
                      {report.reviewedAt ? "Reviewed" : "Open"}
                    </span>
                    <strong>{report.target ? report.target.type : "Missing content"}</strong>
                    <small>
                      Reported by @{report.reporter.username} · {formatDateTime(report.createdAt)}
                    </small>
                  </div>
                  {report.target ? (
                    <p>{report.target.body.slice(0, 220) || "(media only)"}</p>
                  ) : (
                    <p>This reported content no longer exists.</p>
                  )}
                  {report.reason ? <small>Reason: {report.reason}</small> : null}
                  {report.target ? (
                    <small>
                      Author: @{report.target.author.username}
                      {report.target.deletedAt ? " · hidden" : ""}
                      {report.target.author.invalidatedAt ? " · invalidated" : ""}
                    </small>
                  ) : null}
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    disabled={busyReportId === report.id || !report.target || Boolean(report.target.deletedAt)}
                    onClick={() => handleReportAction(report, "hide")}
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    disabled={busyReportId === report.id || !report.target || Boolean(report.target.author.invalidatedAt)}
                    onClick={() => handleReportAction(report, "invalidate")}
                  >
                    Invalidate user
                  </button>
                  <button
                    type="button"
                    disabled={busyReportId === report.id || Boolean(report.reviewedAt)}
                    onClick={() => handleReportAction(report, "review")}
                  >
                    Mark reviewed
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <UserCog size={20} />
          <h2>Users</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Location</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className={user.avatarUrl ? "admin-avatar image-avatar" : "admin-avatar"}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.displayName)}
                      </div>
                      <div>
                        <strong>{user.displayName}</strong>
                        <span>@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <span>{user.ipLocation ?? "Unknown"}</span>
                    <small>{user.ipAddress ?? "No IP"}</small>
                  </td>
                  <td>
                    <span>{user._count.posts} posts</span>
                    <small>{user._count.comments} comments</small>
                  </td>
                  <td>
                    <span className={user.invalidatedAt ? "admin-status invalid" : "admin-status"}>
                      {user.invalidatedAt ? "Invalidated" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" onClick={() => resetPassword(user)} disabled={busyUserId === user.id}>
                        <RotateCcw size={16} />
                        Reset
                      </button>
                      <button type="button" onClick={() => toggleInvalidation(user)} disabled={busyUserId === user.id}>
                        {user.invalidatedAt ? <Shield size={16} /> : <ShieldOff size={16} />}
                        {user.invalidatedAt ? "Restore" : "Invalidate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-account-panel">
        <div className="admin-panel-heading">
          <KeyRound size={20} />
          <h2>Admin Password</h2>
        </div>
        <label className="admin-field">
          <span>Current password</span>
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <label className="admin-field">
          <span>New password</span>
          <input type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
        </label>
        <button className="admin-primary-button" type="button" onClick={changeAdminPassword}>
          Update password
        </button>
      </section>
    </main>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
