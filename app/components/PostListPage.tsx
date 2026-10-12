"use client";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Heart,
  Home,
  Image as ImageIcon,
  CalendarDays,
  Flag,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MediaGrid } from "@/app/components/MediaGrid";
import { ReportDialog } from "@/app/components/ReportDialog";
import type { AppPost, AppUser, Locale } from "@/lib/shared";

const LOCALE_STORAGE_KEY = "deepsea_locale";

const copy = {
  zh: {
    profile: "个人主页",
    postsCount: "帖子",
    editProfile: "编辑资料",
    moreActions: "更多个人主页操作",
    joined: "加入于",
    followers: "关注者",
    following: "正在关注",
    posts: "帖子",
    profileSections: "个人主页内容",
    tabs: {
      posts: "帖子",
      replies: "回复",
      likes: "喜欢",
    },
    pleaseLogIn: "请先登录。",
    loading: "加载中...",
    noPosts: "还没有帖子",
    noReplies: "还没有回复",
    noLikes: "还没有喜欢的内容",
    linkCopied: "链接已复制。",
    report: "举报",
    reported: "已收到举报。",
  },
  en: {
    profile: "Profile",
    postsCount: "posts",
    editProfile: "Edit Profile",
    moreActions: "More profile actions",
    joined: "Joined",
    followers: "followers",
    following: "following",
    posts: "posts",
    profileSections: "Profile sections",
    tabs: {
      posts: "Posts",
      replies: "Replies",
      likes: "Likes",
    },
    pleaseLogIn: "Please log in first.",
    loading: "Loading...",
    noPosts: "No posts yet",
    noReplies: "No replies yet",
    noLikes: "No likes yet",
    linkCopied: "链接已复制。",
    report: "Report",
    reported: "Report received.",
  },
  ja: {
    profile: "プロフィール",
    postsCount: "投稿",
    editProfile: "プロフィールを編集",
    moreActions: "プロフィールのその他操作",
    joined: "登録日",
    followers: "フォロワー",
    following: "フォロー中",
    posts: "投稿",
    profileSections: "プロフィール項目",
    tabs: {
      posts: "投稿",
      replies: "返信",
      likes: "いいね",
    },
    pleaseLogIn: "先にログインしてください。",
    loading: "読み込み中...",
    noPosts: "まだ投稿がありません",
    noReplies: "まだ返信がありません",
    noLikes: "まだいいねがありません",
    linkCopied: "リンクをコピーしました。",
    report: "報告",
    reported: "報告を受け付けました。",
  },
};

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

type ApiResponse = {
  user?: AppUser;
  posts?: AppPost[];
  error?: string;
};

export function PostListPage({
  title,
  endpoint,
  emptyText,
  mode,
}: {
  title: string;
  endpoint: string;
  emptyText: string;
  mode: "profile" | "bookmarks";
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileTab, setProfileTab] = useState<"posts" | "replies" | "likes">("posts");
  const [locale, setLocale] = useState<Locale>("zh");
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const text = copy[locale];

  useEffect(() => {
    async function loadPageData() {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

      if (isLocale(savedLocale)) {
        setLocale(savedLocale);
      }

      const response = await fetch(endpoint);
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (!response.ok) {
        setNotice(data?.error ?? copy[isLocale(savedLocale) ? savedLocale : "zh"].pleaseLogIn);
      } else {
        setUser(data?.user ?? null);
        setPosts(data?.posts ?? []);

        if (!isLocale(savedLocale) && data?.user?.language) {
          setLocale(data.user.language);
        }
      }

      setLoading(false);
    }

    loadPageData();
  }, [endpoint]);

  async function handleToggleBookmark(postId: string) {
    const response = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as {
      bookmarked?: boolean;
      bookmarkCount?: number;
      error?: string;
    } | null;

    if (!response.ok || typeof data?.bookmarked !== "boolean") {
      setNotice(data?.error ?? text.pleaseLogIn);
      return;
    }

    if (mode === "bookmarks" && !data.bookmarked) {
      setPosts((items) => items.filter((post) => post.id !== postId));
      return;
    }

    setPosts((items) =>
      items.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: data.bookmarked,
              stats: { ...post.stats, bookmarks: String(data.bookmarkCount ?? post.stats.bookmarks ?? "0") },
            }
          : post,
      ),
    );
  }

  async function handleToggleRepost(postId: string) {
    const response = await fetch(`/api/posts/${postId}/repost`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as {
      reposted?: boolean;
      repostCount?: number;
      error?: string;
    } | null;

    if (!response.ok || typeof data?.reposted !== "boolean") {
      setNotice(data?.error ?? text.pleaseLogIn);
      return;
    }

    setPosts((items) =>
      items.map((post) =>
        post.id === postId
          ? { ...post, reposted: data.reposted, stats: { ...post.stats, reposts: String(data.repostCount ?? post.stats.reposts) } }
          : post,
      ),
    );
  }

  async function handleRecordView(postId: string) {
    const response = await fetch(`/api/posts/${postId}/view`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { viewCount?: number } | null;

    if (!response.ok || typeof data?.viewCount !== "number") {
      return;
    }

    setPosts((items) =>
      items.map((post) =>
        post.id === postId ? { ...post, stats: { ...post.stats, views: String(data.viewCount) } } : post,
      ),
    );
  }

  async function handleShare(postId: string) {
    const link = `${window.location.origin}/posts/${postId}`;

    try {
      await navigator.clipboard.writeText(link);
      setNotice(text.linkCopied);
    } catch {
      setNotice(link);
    }
  }

  async function handleReportPost(reason: string) {
    if (!reportPostId) {
      return;
    }

    const response = await fetch(`/api/posts/${reportPostId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setNotice(data?.error ?? text.pleaseLogIn);
      return;
    }

    setReportPostId(null);
    setNotice(text.reported);
  }

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header">
          <Link href="/" aria-label="Back home">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{mode === "profile" ? text.profile : title}</h1>
            <p>{mode === "profile" && user ? `@${user.username}` : `${posts.length} ${text.postsCount}`}</p>
          </div>
          <Link href="/" aria-label="Home">
            <Home size={22} />
          </Link>
        </header>

        {mode === "profile" && user ? (
          <>
            <section className="profile-hero">
              <div className="profile-cover" />
              <div className="profile-hero-main">
                <div className={user.avatarUrl ? "profile-avatar-xl image-avatar" : "profile-avatar-xl"}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.displayName)}
                </div>
                <div className="profile-controls">
                  <Link href="/profile/edit">{text.editProfile}</Link>
                  <button type="button" aria-label={text.moreActions}>
                    <MoreHorizontal size={24} />
                  </button>
                </div>
                <h2>{user.displayName}</h2>
                <p className="profile-handle">
                  <Sun size={21} />
                  <span>@{user.username}</span>
                </p>
                <p className="profile-joined">
                  {user.ipLocation ? (
                    <span>
                      <MapPin size={18} />
                      {user.ipLocation}
                    </span>
                  ) : null}
                  <span>
                    <CalendarDays size={18} />
                    {text.joined} {formatJoinedDate(user.createdAt, locale)}
                  </span>
                </p>
                {user.description ? <p className="profile-description">{user.description}</p> : null}
                <div className="profile-stats">
                  <Link className="profile-stat-link" href={`/users/${user.username}/follows?tab=followers`}>
                    <strong>{user.stats?.followers ?? "0"}</strong> {text.followers}
                  </Link>
                  <Link className="profile-stat-link" href={`/users/${user.username}/follows?tab=following`}>
                    <strong>{user.stats?.following ?? "0"}</strong> {text.following}
                  </Link>
                  <span>
                    <strong>{user.stats?.posts ?? String(posts.length)}</strong> {text.posts}
                  </span>
                </div>
              </div>
              <div className="profile-tabs" role="tablist" aria-label={text.profileSections}>
                {[
                  ["posts", text.tabs.posts],
                  ["replies", text.tabs.replies],
                  ["likes", text.tabs.likes],
                ].map(([key, label]) => (
                  <button
                    className={profileTab === key ? "active" : undefined}
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={profileTab === key}
                    onClick={() => setProfileTab(key as "posts" | "replies" | "likes")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {notice ? <div className="empty-state">{notice}</div> : null}
        {loading ? <div className="empty-state">{text.loading}</div> : null}
        {!loading && !notice && posts.length === 0 && profileTab === "posts" ? (
          <div className="empty-state detail-empty">
            {mode === "bookmarks" ? <Bookmark size={42} /> : <ImageIcon size={42} />}
            <span>{mode === "profile" ? text.noPosts : emptyText}</span>
          </div>
        ) : null}
        {!loading && !notice && mode === "profile" && profileTab !== "posts" ? (
          <div className="empty-state detail-empty">
            <ImageIcon size={42} />
            <span>{profileTab === "replies" ? text.noReplies : text.noLikes}</span>
          </div>
        ) : null}

        <section className="timeline" aria-label={title}>
          {(mode === "profile" && profileTab !== "posts" ? [] : posts).map((post) => (
            <article
              className="post-card clickable-post"
              key={post.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/posts/${post.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  router.push(`/posts/${post.id}`);
                }
              }}
            >
              <button
                className={post.authorAvatarUrl ? "avatar small image-avatar avatar-button" : "avatar small avatar-button"}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(`/users/${post.authorUsername}`);
                }}
              >
                {post.authorAvatarUrl ? <img src={post.authorAvatarUrl} alt="" /> : post.author.slice(0, 2).toUpperCase()}
              </button>
              <div className="post-content">
                <div className="post-meta">
                  <div>
                    <button
                      className="author-link-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/users/${post.authorUsername}`);
                      }}
                    >
                      {post.author}
                    </button>
                    <span>{post.handle}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <p className="post-body">{post.body}</p>
                <MediaGrid media={post.media} />
                <div className="action-bar">
                  <button type="button" onClick={(event) => event.stopPropagation()}>
                    <MessageCircle size={18} />
                    <span>{post.stats.replies}</span>
                  </button>
                  <button
                    className={post.reposted ? "action-active repost-active" : undefined}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleRepost(post.id);
                    }}
                  >
                    <Repeat2 size={18} />
                    <span>{post.stats.reposts}</span>
                  </button>
                  <button
                    className={post.liked ? "action-active like-active" : undefined}
                    type="button"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Heart size={18} />
                    <span>{post.stats.likes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRecordView(post.id);
                    }}
                  >
                    <BarChart3 size={18} />
                    <span>{post.stats.views}</span>
                  </button>
                  <button
                    className={post.bookmarked ? "action-active" : undefined}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleBookmark(post.id);
                    }}
                  >
                    <Bookmark fill={post.bookmarked ? "currentColor" : "none"} size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleShare(post.id);
                    }}
                  >
                    <Share size={18} />
                  </button>
                  <button
                    type="button"
                    title={text.report}
                    onClick={(event) => {
                      event.stopPropagation();
                      setReportPostId(post.id);
                    }}
                  >
                    <Flag size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
      <ReportDialog
        locale={locale}
        open={Boolean(reportPostId)}
        onClose={() => setReportPostId(null)}
        onSubmit={handleReportPost}
      />
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
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatJoinedDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
