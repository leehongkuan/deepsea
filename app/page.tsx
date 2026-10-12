"use client";

import {
  Bell,
  Bookmark,
  BarChart3,
  Compass,
  Feather,
  Flag,
  Heart,
  Home,
  Languages,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Search,
  Settings,
  Share,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ComposerBox, type ComposerMedia } from "@/app/components/ComposerBox";
import { MediaGrid } from "@/app/components/MediaGrid";
import { ReportDialog } from "@/app/components/ReportDialog";
import type { AppPost, AppUser, Locale } from "@/lib/shared";

const copy = {
  zh: {
    home: "首页",
    explore: "探索",
    notifications: "通知",
    bookmarks: "书签",
    profile: "个人主页",
    settings: "设置",
    post: "发布",
    composer: "有什么新鲜事？",
    media: "媒体",
    timeline: "推荐",
    following: "关注",
    showMore: "展开全文",
    showLess: "收起",
    chars: "最多 5000 字",
    search: "搜索内容",
    lang: "语言",
    login: "登录",
    register: "注册",
    logout: "退出",
    goToProfile: "进入个人主页",
    signOut: "退出登录",
    guestName: "访客",
    guestHandle: "@guest",
    authRequired: "注册或登录后才能发布内容。",
    postSaved: "已发布到数据库时间线",
    loadFailed: "无法连接数据库 API，请稍后重试。",
    empty: "还没有帖子。",
    followingEmpty: "你关注的人还没有发布或转发内容。",
    report: "举报",
    reported: "已收到举报。",
  },
  en: {
    home: "Home",
    explore: "Explore",
    notifications: "Notifications",
    bookmarks: "Bookmarks",
    profile: "Profile",
    settings: "Settings",
    post: "Post",
    composer: "What is happening?",
    media: "Media",
    timeline: "For you",
    following: "Following",
    showMore: "Show more",
    showLess: "Show less",
    chars: "Up to 5000 characters",
    search: "Search posts",
    lang: "Language",
    login: "Log in",
    register: "Create account",
    logout: "Log out",
    goToProfile: "Go to profile",
    signOut: "Sign out",
    guestName: "Guest",
    guestHandle: "@guest",
    authRequired: "Create an account or log in before posting.",
    postSaved: "Posted to the database timeline",
    loadFailed: "Could not connect to the database API. Please try again.",
    empty: "No posts yet.",
    followingEmpty: "People you follow have not posted or reposted yet.",
    report: "Report",
    reported: "Report received.",
  },
  ja: {
    home: "ホーム",
    explore: "探す",
    notifications: "通知",
    bookmarks: "ブックマーク",
    profile: "プロフィール",
    settings: "設定",
    post: "投稿",
    composer: "いまどうしてる？",
    media: "メディア",
    timeline: "おすすめ",
    following: "フォロー中",
    showMore: "さらに表示",
    showLess: "閉じる",
    chars: "最大 5000 文字",
    search: "投稿を検索",
    lang: "言語",
    login: "ログイン",
    register: "登録",
    logout: "ログアウト",
    goToProfile: "プロフィールへ",
    signOut: "サインアウト",
    guestName: "ゲスト",
    guestHandle: "@guest",
    authRequired: "投稿するには登録またはログインしてください。",
    postSaved: "データベースのタイムラインに投稿しました",
    loadFailed: "データベース API に接続できません。もう一度お試しください。",
    empty: "まだ投稿がありません。",
    followingEmpty: "フォロー中のユーザーの投稿やリポストはまだありません。",
    report: "報告",
    reported: "報告を受け付けました。",
  },
};

const navItems = [
  { key: "home", icon: Home, href: "/" },
  { key: "explore", icon: Compass, href: "/explore" },
  { key: "notifications", icon: Bell, href: "/notifications" },
  { key: "bookmarks", icon: Bookmark, href: "/bookmarks" },
  { key: "profile", icon: User, href: "/profile" },
  { key: "settings", icon: Settings, href: "/settings" },
] as const;

const LOCALE_STORAGE_KEY = "deepsea_locale";

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"for-you" | "following">("for-you");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const text = copy[locale];

  const activePosts = useMemo(() => posts, [posts]);
  const displayName = currentUser?.displayName ?? text.guestName;
  const handle = currentUser ? `@${currentUser.username}` : text.guestHandle;

  useEffect(() => {
    async function loadInitialData() {
      try {
        const meResponse = await fetch("/api/auth/me");
        const meData = (await meResponse.json()) as { user: AppUser | null };

        setCurrentUser(meData.user);

        if (meData.user) {
          const postsResponse = await fetch("/api/posts");
          const postsData = (await postsResponse.json()) as { posts: AppPost[] };
          setPosts(postsData.posts);
        } else {
          setPosts([]);
        }

        const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

        if (isLocale(savedLocale)) {
          setLocale(savedLocale);
        } else if (meData.user?.language) {
          setLocale(meData.user.language);
        }
      } catch {
        setNotice(copy.zh.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  function handleLocaleChange(value: Locale) {
    setLocale(value);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
  }

  async function loadFeed(nextFeed: "for-you" | "following") {
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch(nextFeed === "following" ? "/api/posts?feed=following" : "/api/posts");
      const data = (await response.json().catch(() => null)) as { posts?: AppPost[]; error?: string } | null;

      if (!response.ok || !data?.posts) {
        setNotice(data?.error ?? text.loadFailed);
        setPosts([]);
        return;
      }

      setPosts(data.posts);
    } catch {
      setNotice(text.loadFailed);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFeedChange(nextFeed: "for-you" | "following") {
    if (nextFeed === feedTab) {
      return;
    }

    setFeedTab(nextFeed);
    loadFeed(nextFeed);
  }

  async function handleSubmit(payload: { body: string; media: ComposerMedia[] }) {
    if (!currentUser) {
      setNotice(text.authRequired);
      return false;
    }

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNotice(data?.error ?? text.loadFailed);
      return false;
    }

    const data = (await response.json()) as { post: AppPost };
    setPosts((items) => [data.post, ...items]);
    setNotice(text.postSaved);
    return true;
  }

  async function handleToggleLike(postId: string) {
    const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNotice(data?.error ?? text.authRequired);
      return;
    }

    const data = (await response.json()) as { liked: boolean; likeCount: number };
    setPosts((items) =>
      items.map((post) =>
        post.id === postId
          ? { ...post, liked: data.liked, stats: { ...post.stats, likes: String(data.likeCount) } }
          : post,
      ),
    );
  }

  async function handleToggleBookmark(postId: string) {
    const response = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNotice(data?.error ?? text.authRequired);
      return;
    }

    const data = (await response.json()) as { bookmarked: boolean; bookmarkCount: number };
    setPosts((items) =>
      items.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: data.bookmarked,
              stats: { ...post.stats, bookmarks: String(data.bookmarkCount) },
            }
          : post,
      ),
    );
  }

  async function handleToggleRepost(postId: string) {
    const response = await fetch(`/api/posts/${postId}/repost`, { method: "POST" });

    if (!response.ok) {
      setNotice(text.authRequired);
      return;
    }

    const data = (await response.json()) as { reposted: boolean; repostCount: number };
    setPosts((items) => {
      const updatedItems = items.map((post) =>
        post.id === postId
          ? {
              ...post,
              reposted: data.reposted,
              repostedBy: post.repostedBy && data.reposted ? post.repostedBy : undefined,
              repostedAt: post.repostedAt && data.reposted ? post.repostedAt : undefined,
              stats: { ...post.stats, reposts: String(data.repostCount) },
            }
          : post,
      );

      if (!data.reposted) {
        return updatedItems.map((post) =>
          post.id === postId
            ? { ...post, timelineId: undefined, repostedBy: undefined, repostedAt: undefined }
            : post,
        );
      }

      const original = updatedItems.find((post) => post.id === postId);

      if (!original || !currentUser) {
        return updatedItems;
      }

      const repostedItem: AppPost = {
        ...original,
        timelineId: `repost:local:${postId}`,
        repostedBy: currentUser.displayName,
        repostedAt: new Date().toISOString(),
      };

      return [
        repostedItem,
        ...updatedItems.filter((post) => post.id !== postId),
      ];
    });
  }

  async function handleRecordView(postId: string) {
    const response = await fetch(`/api/posts/${postId}/view`, { method: "POST" });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { viewCount: number };
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
      setNotice("链接已复制。");
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
      setNotice(data?.error ?? text.authRequired);
      return;
    }

    setReportPostId(null);
    setNotice(text.reported);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setPosts([]);
    setNotice("");
    setProfileMenuOpen(false);
    setBrandMenuOpen(false);
  }

  if (!loading && !currentUser) {
    return <LandingPage />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-menu-wrap">
          {brandMenuOpen ? (
            <div className="profile-menu brand-menu" role="menu">
              <Link href="/profile" role="menuitem" onClick={() => setBrandMenuOpen(false)}>
                <User size={18} />
                <span>{text.goToProfile}</span>
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout}>
                <LogOut size={18} />
                <span>{text.signOut}</span>
              </button>
            </div>
          ) : null}

          <button
            className="brand"
            type="button"
            aria-expanded={brandMenuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setBrandMenuOpen((open) => !open);
              setProfileMenuOpen(false);
            }}
          >
            <UserAvatar className="avatar brand-avatar" name={displayName} src={currentUser?.avatarUrl} />
            <div className="brand-identity">
              <strong>{displayName}</strong>
              <span>{handle}</span>
            </div>
            <MoreHorizontal className="brand-more" size={22} />
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="nav-item" key={item.key} href={item.href}>
                {item.key === "home" ? (
                  <img className="nav-logo" src="/deepsea-logo.svg" alt="" />
                ) : (
                  <Icon size={24} />
                )}
                <span>{text[item.key]}</span>
              </Link>
            );
          })}
        </nav>

        <button className="post-button">
          <Feather size={20} />
          <span>{text.post}</span>
        </button>

        <div className="profile-menu-wrap">
          {profileMenuOpen ? (
            <div className="profile-menu" role="menu">
              <Link href="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                <User size={18} />
                <span>{text.goToProfile}</span>
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout}>
                <LogOut size={18} />
                <span>{text.signOut}</span>
              </button>
            </div>
          ) : null}

          <button
            className="viewer-card"
            type="button"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setProfileMenuOpen((open) => !open);
              setBrandMenuOpen(false);
            }}
          >
            <UserAvatar className="avatar" name={displayName} src={currentUser?.avatarUrl} />
            <div>
              <strong>{displayName}</strong>
              <span>{handle}</span>
            </div>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1 className="brand-heading">
              <img src="/deepsea-logo.svg" alt="" />
              <span>{text.home}</span>
            </h1>
          </div>
          <label className="language-switcher">
            <Languages size={18} />
            <span>{text.lang}</span>
            <select value={locale} onChange={(event) => handleLocaleChange(event.target.value as Locale)}>
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <div className="auth-links">
            {currentUser ? (
              <button onClick={handleLogout}>{text.logout}</button>
            ) : (
              <>
                <Link href="/login">{text.login}</Link>
                <Link className="primary-auth-link" href="/register">
                  {text.register}
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="mobile-search">
          <Search size={18} />
          <input aria-label={text.search} placeholder={text.search} />
        </div>

        <div className="tabs">
          <button
            className={feedTab === "for-you" ? "tab active" : "tab"}
            type="button"
            aria-selected={feedTab === "for-you"}
            onClick={() => handleFeedChange("for-you")}
          >
            {text.timeline}
          </button>
          <button
            className={feedTab === "following" ? "tab active" : "tab"}
            type="button"
            aria-selected={feedTab === "following"}
            onClick={() => handleFeedChange("following")}
          >
            {text.following}
          </button>
        </div>

        <ComposerBox
          avatar={currentUser?.avatarUrl ?? initials(displayName)}
          placeholder={text.composer}
          submitLabel={text.post}
          helperText={text.chars}
          disabled={!currentUser}
          notice={notice}
          onNotice={setNotice}
          onSubmit={handleSubmit}
        />

        <section className="timeline" aria-label="Timeline">
          {loading ? <div className="empty-state">Loading...</div> : null}
          {!loading && activePosts.length === 0 ? (
            <div className="empty-state">{feedTab === "following" ? text.followingEmpty : text.empty}</div>
          ) : null}
          {!loading
            ? activePosts.map((post) => (
                <PostCard
                  key={post.timelineId ?? post.id}
                  post={post}
                  labels={text}
                  onToggleLike={handleToggleLike}
                  onToggleRepost={handleToggleRepost}
                  onToggleBookmark={handleToggleBookmark}
                  onRecordView={handleRecordView}
                  onShare={handleShare}
                  onReport={setReportPostId}
                />
              ))
            : null}
        </section>
      </section>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href}>
              {item.key === "home" ? <img className="bottom-nav-logo" src="/deepsea-logo.svg" alt="" /> : <Icon size={22} />}
              <span>{text[item.key]}</span>
            </Link>
          );
        })}
      </nav>
      <ReportDialog
        locale={locale}
        open={Boolean(reportPostId)}
        onClose={() => setReportPostId(null)}
        onSubmit={handleReportPost}
      />
    </main>
  );
}

function LandingPage() {
  return (
    <main className="landing-shell">
      <div className="landing-light landing-light-one" />
      <div className="landing-light landing-light-two" />
      <section className="landing-content" aria-label="DeepSea welcome">
        <img className="landing-logo" src="/deepsea-logo.svg" alt="" />
        <h1>Welcom to DeepSea</h1>
        <div className="landing-actions">
          <Link href="/login">Log in</Link>
          <Link className="landing-primary" href="/register">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}

function PostCard({
  post,
  labels,
  onToggleLike,
  onToggleRepost,
  onToggleBookmark,
  onRecordView,
  onShare,
  onReport,
}: {
  post: AppPost;
  labels: (typeof copy)[Locale];
  onToggleLike: (postId: string) => void;
  onToggleRepost: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onRecordView: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const body = post.body;
  const shouldCollapse = body.length > 200;
  const visibleBody = shouldCollapse && !expanded ? `${body.slice(0, 200)}...` : body;

  return (
    <article
      className="post-card clickable-post"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/posts/${post.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          router.push(`/posts/${post.id}`);
        }
      }}
    >
      {post.repostedBy ? (
        <div className="repost-context">
          <Repeat2 size={15} />
          <span>{post.repostedBy} reposted</span>
        </div>
      ) : null}
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
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>
          <button title="More" onClick={(event) => event.stopPropagation()}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <p className="post-body">{visibleBody}</p>
        {shouldCollapse ? (
          <button
            className="show-more"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
          >
            {expanded ? labels.showLess : labels.showMore}
          </button>
        ) : null}

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
              onToggleRepost(post.id);
            }}
          >
            <Repeat2 size={18} />
            <span>{post.stats.reposts}</span>
          </button>
          <button
            className={post.liked ? "action-active like-active" : undefined}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleLike(post.id);
            }}
          >
            <Heart size={18} />
            <span>{post.stats.likes}</span>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRecordView(post.id);
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
              onToggleBookmark(post.id);
            }}
          >
            <Bookmark fill={post.bookmarked ? "currentColor" : "none"} size={18} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onShare(post.id);
            }}
          >
            <Share size={18} />
          </button>
          <button
            type="button"
            title={labels.report}
            onClick={(event) => {
              event.stopPropagation();
              onReport(post.id);
            }}
          >
            <Flag size={18} />
          </button>
        </div>
      </div>
    </article>
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

function UserAvatar({ className, name, src }: { className: string; name: string; src?: string | null }) {
  if (src) {
    return (
      <div className={`${className} image-avatar`}>
        <img src={src} alt="" />
      </div>
    );
  }

  return <div className={className}>{initials(name)}</div>;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
}

function resizeComposer(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}
