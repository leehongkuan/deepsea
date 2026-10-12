"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { avatarOptions } from "@/lib/avatars";
import type { AppUser } from "@/lib/shared";

export default function EditProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(avatarOptions[0].url);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/auth/me");
      const data = (await response.json().catch(() => null)) as { user?: AppUser | null } | null;

      if (!response.ok || !data?.user) {
        setNotice("Please log in first.");
      } else {
        setDisplayName(data.user.displayName);
        setDescription(data.user.description ?? "");
        setAvatarUrl(data.user.avatarUrl ?? avatarOptions[0].url);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave() {
    if (!displayName.trim()) {
      setNotice("Display name is required.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        description,
        avatarUrl,
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);

    if (!response.ok) {
      setNotice(data?.error ?? "Save failed.");
      return;
    }

    router.push("/profile");
  }

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header edit-profile-header">
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>Edit Profile</h1>
            <p>Avatar, name, and description</p>
          </div>
          <button className="header-save-button" type="button" onClick={handleSave} disabled={saving || loading}>
            Save
          </button>
        </header>

        {notice ? <div className="empty-state">{notice}</div> : null}
        {loading ? <div className="empty-state">Loading...</div> : null}

        {!loading ? (
          <section className="edit-profile-form">
            <div className="edit-profile-preview">
              <img src={avatarUrl} alt="" />
              <div>
                <strong>{displayName || "Display Name"}</strong>
                <span>{description || "Description"}</span>
              </div>
            </div>

            <label className="field-block">
              <span>Avatar</span>
              <div className="avatar-picker" role="radiogroup" aria-label="Avatar">
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
                    {avatarUrl === avatar.url ? <Check size={17} /> : null}
                  </button>
                ))}
              </div>
            </label>

            <label className="field-block">
              <span>Display Name</span>
              <div className="auth-input profile-name-input">
                <input
                  maxLength={50}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display Name"
                />
              </div>
            </label>

            <label className="field-block">
              <span>Description</span>
              <textarea
                className="profile-description-input"
                maxLength={280}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell people about yourself"
              />
            </label>
          </section>
        ) : null}
      </section>
    </main>
  );
}
