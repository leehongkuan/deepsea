"use client";

import { CalendarDays, ChevronLeft, Eye, EyeOff, Globe2, KeyRound, Lock, Mail, PenLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { avatarOptions } from "@/lib/avatars";
import type { Locale } from "@/lib/shared";

const registerCopy = {
  zh: {
    title: "创建账号",
    subtitle: "很高兴你加入 deepSea！",
    step: "第 1 / 3 步",
    heading: "你的账号",
    server: "你正在 deepSea Social 创建账号",
    email: "邮箱",
    emailPlaceholder: "输入你的邮箱地址",
    password: "密码",
    passwordPlaceholder: "设置你的密码",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    confirmPassword: "确认密码",
    confirmPasswordPlaceholder: "再次输入密码",
    displayName: "显示名称",
    displayNamePlaceholder: "输入你的显示名称",
    avatar: "选择头像",
    birthDate: "出生日期",
    inviteCode: "邀请码",
    inviteCodePlaceholder: "输入内测邀请码",
    termsPrefix: "创建账号即表示你同意 deepSea 的",
    termsLink: "服务条款",
    privacyPrefix: "和",
    privacyLink: "隐私政策",
    back: "返回",
    next: "下一步",
    language: "中文",
    support: "遇到问题？联系支持",
    error: "请填写所有字段。",
    passwordMismatch: "两次输入的密码必须一致。",
  },
  en: {
    title: "Create account",
    subtitle: "We are so excited to have you join us!",
    step: "Step 1 of 3",
    heading: "Your account",
    server: "You are creating an account on deepSea Social",
    email: "Email",
    emailPlaceholder: "Enter your email address",
    password: "Password",
    passwordPlaceholder: "Choose your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Enter password again",
    displayName: "Display name",
    displayNamePlaceholder: "Enter your display name",
    avatar: "Choose avatar",
    birthDate: "Your birth date",
    inviteCode: "Invitation code",
    inviteCodePlaceholder: "Enter beta invitation code",
    termsPrefix: "By creating an account you agree to the deepSea",
    termsLink: "Terms of Service",
    privacyPrefix: "and",
    privacyLink: "Privacy Policy",
    back: "Back",
    next: "Next",
    language: "English",
    support: "Having trouble? Contact support",
    error: "Please complete every field.",
    passwordMismatch: "Both passwords must match.",
  },
  ja: {
    title: "アカウント作成",
    subtitle: "deepSea へようこそ！",
    step: "ステップ 1 / 3",
    heading: "あなたのアカウント",
    server: "deepSea Social でアカウントを作成しています",
    email: "メール",
    emailPlaceholder: "メールアドレスを入力",
    password: "パスワード",
    passwordPlaceholder: "パスワードを設定",
    showPassword: "パスワードを表示",
    hidePassword: "パスワードを隠す",
    confirmPassword: "パスワード確認",
    confirmPasswordPlaceholder: "もう一度入力",
    displayName: "表示名",
    displayNamePlaceholder: "表示名を入力",
    avatar: "アバターを選択",
    birthDate: "生年月日",
    inviteCode: "招待コード",
    inviteCodePlaceholder: "ベータ招待コードを入力",
    termsPrefix: "アカウント作成により、deepSea の",
    termsLink: "利用規約",
    privacyPrefix: "および",
    privacyLink: "プライバシーポリシー",
    back: "戻る",
    next: "次へ",
    language: "日本語",
    support: "お困りですか？サポートへ",
    error: "すべての項目を入力してください。",
    passwordMismatch: "2つのパスワードが一致している必要があります。",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(avatarOptions[0].url);
  const [birthDate, setBirthDate] = useState("1980-01-01");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const text = registerCopy[locale];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitRegistration();
  }

  async function submitRegistration() {
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !displayName.trim() || !birthDate || !inviteCode.trim()) {
      setError(text.error);
      return;
    }

    if (password !== confirmPassword) {
      setError(text.passwordMismatch);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
        displayName,
        avatarUrl,
        birthDate,
        inviteCode,
        language: locale,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? text.error);
      return;
    }

    router.push("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
      </section>

      <section className="auth-panel" aria-label={text.title}>
        <form className="auth-form" autoComplete="off" onSubmit={handleSubmit}>
          <div className="auth-step">{text.step}</div>
          <h2>{text.heading}</h2>

          <div className="server-row">
            <span>{text.server}</span>
            <PenLine size={15} />
          </div>

          <label className="field-block">
            <span>{text.email}</span>
            <div className="auth-input">
              <Mail size={19} />
              <input
                autoComplete="off"
                name="deepsea_signup_email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
              />
            </div>
          </label>

          <label className="field-block">
            <span>{text.password}</span>
            <div className="auth-input password-input">
              <Lock size={19} />
              <input
                autoComplete="new-password"
                name="deepsea_signup_password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
              />
              <button
                type="button"
                aria-label={showPassword ? text.hidePassword : text.showPassword}
                title={showPassword ? text.hidePassword : text.showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="field-block">
            <span>{text.confirmPassword}</span>
            <div className="auth-input password-input">
              <Lock size={19} />
              <input
                autoComplete="new-password"
                name="deepsea_signup_confirm_password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={text.confirmPasswordPlaceholder}
              />
            </div>
          </label>

          <label className="field-block">
            <span>{text.displayName}</span>
            <div className="auth-input">
              <PenLine size={19} />
              <input
                autoComplete="off"
                name="deepsea_signup_display_name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={text.displayNamePlaceholder}
              />
            </div>
          </label>

          <label className="field-block">
            <span>{text.birthDate}</span>
            <div className="auth-input">
              <CalendarDays size={19} />
              <input
                autoComplete="off"
                name="deepsea_signup_birth_date"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </div>
          </label>

          <label className="field-block">
            <span>{text.inviteCode}</span>
            <div className="auth-input">
              <KeyRound size={19} />
              <input
                autoComplete="off"
                name="deepsea_signup_invite_code"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={text.inviteCodePlaceholder}
              />
            </div>
          </label>

          <div className="field-block">
            <span>{text.avatar}</span>
            <div className="avatar-picker" role="radiogroup" aria-label={text.avatar}>
              {avatarOptions.map((avatar) => (
                <button
                  className={avatarUrl === avatar.url ? "selected" : undefined}
                  key={avatar.id}
                  type="button"
                  role="radio"
                  aria-checked={avatarUrl === avatar.url}
                  title={avatar.label}
                  onClick={() => setAvatarUrl(avatar.url)}
                >
                  <img src={avatar.url} alt={avatar.label} />
                </button>
              ))}
            </div>
          </div>

          <p className="terms-text">
            {text.termsPrefix}{" "}
            <Link href="/terms">{text.termsLink}</Link>{" "}
            {text.privacyPrefix}{" "}
            <Link href="/privacy">{text.privacyLink}</Link>
            {locale === "en" ? "." : "。"}
          </p>
          {error ? <p className="form-error">{error}</p> : null}

          <div className="auth-actions">
            <Link className="secondary-button" href="/">
              <ChevronLeft size={18} />
              {text.back}
            </Link>
            <button className="next-button" type="button" onClick={submitRegistration}>
              {text.next}
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
          <Link href="/login">{text.support}</Link>
        </footer>
      </section>
    </main>
  );
}
