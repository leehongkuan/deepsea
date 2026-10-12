"use client";

import { Globe2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/shared";

const loginCopy = {
  zh: {
    title: "欢迎回来",
    subtitle: "登录后可以发布内容。",
    heading: "登录 deepSea",
    email: "邮箱",
    emailPlaceholder: "输入你的邮箱地址",
    password: "密码",
    passwordPlaceholder: "输入你的密码",
    login: "登录",
    create: "创建账号",
    error: "邮箱或密码不正确。",
  },
  en: {
    title: "Welcome back",
    subtitle: "Log in to start posting.",
    heading: "Log in to deepSea",
    email: "Email",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Log in",
    create: "Create account",
    error: "Email or password is incorrect.",
  },
  ja: {
    title: "おかえりなさい",
    subtitle: "ログインすると投稿できます。",
    heading: "deepSea にログイン",
    email: "メール",
    emailPlaceholder: "メールアドレスを入力",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    login: "ログイン",
    create: "アカウント作成",
    error: "メールまたはパスワードが正しくありません。",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const text = loginCopy[locale];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitLogin();
  }

  async function submitLogin() {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? text.error);
      return;
    }

    router.push("/");
  }

  return (
    <main className="auth-shell login-shell">
      <section className="auth-hero">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-form compact-auth-form" onSubmit={handleSubmit}>
          <h2>{text.heading}</h2>

          <label className="field-block">
            <span>{text.email}</span>
            <div className="auth-input">
              <Mail size={19} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
              />
            </div>
          </label>

          <label className="field-block">
            <span>{text.password}</span>
            <div className="auth-input">
              <Lock size={19} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
              />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="auth-actions">
            <Link className="secondary-button" href="/register">
              {text.create}
            </Link>
            <button className="next-button" type="button" onClick={submitLogin}>
              {text.login}
            </button>
          </div>
        </form>

        <footer className="auth-footer">
          <label className="auth-language">
            <Globe2 size={17} />
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <Link href="/">deepSea</Link>
        </footer>
      </section>
    </main>
  );
}
