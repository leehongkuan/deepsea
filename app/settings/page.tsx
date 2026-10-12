"use client";

import {
  ArrowLeft,
  AtSign,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Mail,
  PencilLine,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/shared";

type SettingsData = {
  email: string;
  username: string;
  birthDate: string;
};

const emptySettings: SettingsData = {
  email: "",
  username: "",
  birthDate: "",
};

const LOCALE_STORAGE_KEY = "deepsea_locale";

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

const copy = {
  zh: {
    title: "设置",
    subtitle: "账号访问和身份信息",
    save: "保存",
    backHome: "返回首页",
    loginFirst: "请先登录。",
    saveFailed: "保存失败。",
    saved: "设置已保存。",
    loading: "加载中...",
    accountSettings: "账号设置",
    email: "邮箱",
    updateEmail: "更新邮箱",
    password: "密码",
    passwordPlaceholder: "留空则保持当前密码",
    handle: "用户名",
    handlePlaceholder: "用户名",
    birthday: "生日",
    edit: "编辑",
  },
  en: {
    title: "Settings",
    subtitle: "Account access and identity",
    save: "Save",
    backHome: "Back home",
    loginFirst: "Please log in first.",
    saveFailed: "Save failed.",
    saved: "Settings saved.",
    loading: "Loading...",
    accountSettings: "Account settings",
    email: "Email",
    updateEmail: "Update email",
    password: "Password",
    passwordPlaceholder: "Leave blank to keep current",
    handle: "Handle",
    handlePlaceholder: "handle",
    birthday: "Birthday",
    edit: "Edit",
  },
  ja: {
    title: "設定",
    subtitle: "アカウントと本人情報",
    save: "保存",
    backHome: "ホームへ戻る",
    loginFirst: "先にログインしてください。",
    saveFailed: "保存できませんでした。",
    saved: "設定を保存しました。",
    loading: "読み込み中...",
    accountSettings: "アカウント設定",
    email: "メール",
    updateEmail: "メールを更新",
    password: "パスワード",
    passwordPlaceholder: "空欄の場合は現在のまま",
    handle: "ハンドル",
    handlePlaceholder: "ハンドル",
    birthday: "生年月日",
    edit: "編集",
  },
};

export default function SettingsPage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [settings, setSettings] = useState<SettingsData>(emptySettings);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const text = copy[locale];

  useEffect(() => {
    async function loadSettings() {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

      if (isLocale(savedLocale)) {
        setLocale(savedLocale);
      }

      const response = await fetch("/api/settings");
      const data = (await response.json().catch(() => null)) as { settings?: SettingsData; error?: string } | null;

      if (!response.ok || !data?.settings) {
        setNotice(copy[isLocale(savedLocale) ? savedLocale : "zh"].loginFirst);
      } else {
        setSettings(data.settings);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, password }),
    });
    const data = (await response.json().catch(() => null)) as { settings?: SettingsData; error?: string } | null;
    setSaving(false);

    if (!response.ok || !data?.settings) {
      setNotice(text.saveFailed);
      return;
    }

    setSettings(data.settings);
    setPassword("");
    setNotice(text.saved);
  }

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header edit-profile-header">
          <Link href="/" aria-label={text.backHome}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <button className="header-save-button" type="button" onClick={handleSave} disabled={saving || loading}>
            {text.save}
          </button>
        </header>

        {notice ? <div className="settings-notice">{notice}</div> : null}
        {loading ? <div className="empty-state">{text.loading}</div> : null}

        {!loading ? (
          <section className="settings-list" aria-label={text.accountSettings}>
            <div className="settings-row read-row">
              <Mail size={27} />
              <span>{text.email}</span>
              <strong>{settings.email}</strong>
              <CheckCircle2 size={25} />
            </div>

            <label className="settings-row edit-row">
              <PencilLine size={27} />
              <span>{text.updateEmail}</span>
              <input
                type="email"
                value={settings.email}
                onChange={(event) => setSettings((value) => ({ ...value, email: event.target.value }))}
                placeholder="email@example.com"
              />
              <ChevronRight size={27} />
            </label>

            <label className="settings-row edit-row">
              <KeyRound size={27} />
              <span>{text.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
              />
              <ChevronRight size={27} />
            </label>

            <label className="settings-row edit-row">
              <AtSign size={27} />
              <span>{text.handle}</span>
              <input
                value={settings.username}
                onChange={(event) => setSettings((value) => ({ ...value, username: event.target.value }))}
                placeholder={text.handlePlaceholder}
              />
              <ChevronRight size={27} />
            </label>

            <label className="settings-row edit-row">
              <CalendarDays size={27} />
              <span>{text.birthday}</span>
              <input
                type="date"
                value={settings.birthDate}
                onChange={(event) => setSettings((value) => ({ ...value, birthDate: event.target.value }))}
              />
              <span className="settings-edit-text">{text.edit}</span>
            </label>
          </section>
        ) : null}
      </section>
    </main>
  );
}
