"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { AppFollowUser, AppUser } from "@/lib/shared";

type FollowTab = "followers" | "following";

type FollowsResponse = {
  user?: AppUser;
  users?: AppFollowUser[];
  tab?: FollowTab;
  error?: string;
};

export default function FollowsPage() {
  return (
    <Suspense fallback={<FollowsLoading />}>
      <FollowsContent />
    </Suspense>
  );
}

function FollowsContent() {
  const params = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = params.username;
  const activeTab = normalizeTab(searchParams.get("tab"));
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppFollowUser[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const profileHref = useMemo(() => (user ? `/users/${user.username}` : `/users/${username}`), [user, username]);

  useEffect(() => {
    async function loadFollows() {
      setLoading(true);
      setNotice("");
      const response = await fetch(`/api/users/${username}/follows?tab=${activeTab}`);
      const data = (await response.json().catch(() => null)) as FollowsResponse | null;

      if (!response.ok || !data?.user) {
        setNotice(data?.error ?? "Unable to load users.");
        setUsers([]);
      } else {
        setUser(data.user);
        setUsers(data.users ?? []);
      }

      setLoading(false);
    }

    loadFollows();
  }, [username, activeTab]);

  function switchTab(nextTab: FollowTab) {
    router.replace(`/users/${username}/follows?tab=${nextTab}`);
  }

  async function handleFollow(target: AppFollowUser) {
    const response = await fetch(`/api/users/${target.username}/follow`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { following?: boolean; error?: string } | null;

    if (!response.ok || typeof data?.following !== "boolean") {
      setNotice(data?.error ?? "Please log in first.");
      return;
    }

    setUsers((items) =>
      items.map((item) => (item.id === target.id ? { ...item, followedByViewer: Boolean(data.following) } : item)),
    );
  }

  return (
    <main className="detail-shell">
      <section className="detail-panel follows-panel">
        <header className="detail-header follows-header">
          <button type="button" aria-label="Back" onClick={() => router.back()}>
            <ArrowLeft size={24} />
          </button>
          <Link href={profileHref} className="follows-title-link">
            <h1>{user?.displayName ?? "Profile"}</h1>
            <p>{user ? `@${user.username}` : ""}</p>
          </Link>
          <span />
        </header>

        <div className="follows-tabs" role="tablist" aria-label="Follows sections">
          <button
            className={activeTab === "followers" ? "active" : undefined}
            type="button"
            role="tab"
            aria-selected={activeTab === "followers"}
            onClick={() => switchTab("followers")}
          >
            Followers
          </button>
          <button
            className={activeTab === "following" ? "active" : undefined}
            type="button"
            role="tab"
            aria-selected={activeTab === "following"}
            onClick={() => switchTab("following")}
          >
            Following
          </button>
        </div>

        {notice ? <div className="empty-state">{notice}</div> : null}
        {loading ? <div className="empty-state">Loading...</div> : null}
        {!loading && !notice && users.length === 0 ? (
          <div className="empty-state detail-empty">
            <span>{activeTab === "followers" ? "No followers yet" : "Not following anyone yet"}</span>
          </div>
        ) : null}

        <section className="follow-list" aria-label={activeTab}>
          {users.map((followUser) => (
            <article className="follow-row" key={followUser.id}>
              <button
                className={followUser.avatarUrl ? "follow-avatar image-avatar" : "follow-avatar"}
                type="button"
                onClick={() => router.push(followUser.isViewer ? "/profile" : `/users/${followUser.username}`)}
              >
                {followUser.avatarUrl ? <img src={followUser.avatarUrl} alt="" /> : initials(followUser.displayName)}
              </button>
              <div className="follow-row-main">
                <button
                  className="follow-name-line"
                  type="button"
                  onClick={() => router.push(followUser.isViewer ? "/profile" : `/users/${followUser.username}`)}
                >
                  <strong>{followUser.displayName}</strong>
                  <span>@{followUser.username}</span>
                  {followUser.followsViewer && !followUser.isViewer ? <em>Follows you</em> : null}
                </button>
                {followUser.description ? <p>{followUser.description}</p> : null}
              </div>
              <div className="follow-row-actions">
                {!followUser.isViewer ? (
                  <button
                    className={followUser.followedByViewer ? "follow-action secondary" : "follow-action"}
                    type="button"
                    onClick={() => handleFollow(followUser)}
                  >
                    {followUser.followedByViewer ? "Following" : followUser.followsViewer ? "Follow back" : "Follow"}
                  </button>
                ) : null}
                <button className="follow-more" type="button" aria-label="More user actions">
                  <MoreHorizontal size={22} />
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function FollowsLoading() {
  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <div className="empty-state">Loading...</div>
      </section>
    </main>
  );
}

function normalizeTab(value: string | null): FollowTab {
  return value === "following" ? "following" : "followers";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
