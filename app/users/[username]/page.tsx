"use client";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  CalendarDays,
  Flag,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MediaGrid } from "@/app/components/MediaGrid";
import { ReportDialog } from "@/app/components/ReportDialog";
import type { AppPost, AppUser, Locale } from "@/lib/shared";

const LOCALE_STORAGE_KEY = "deepsea_locale";

const copy = {
  zh: {
    profile: "个人主页",
    backHome: "返回首页",
    editProfile: "编辑资料",
    follow: "关注",
    block: "屏蔽用户",
    unblock: "取消屏蔽",
    following: "正在关注",
    moreActions: "更多个人主页操作",
    joined: "加入于",
    followers: "关注者",
    followingStat: "正在关注",
    postsStat: "帖子",
    profileSections: "个人主页内容",
    posts: "帖子",
    replies: "回复",
    userPosts: "用户帖子",
    userNotFound: "未找到用户。",
    pleaseLogIn: "请先登录。",
    loading: "加载中...",
    noReplies: "还没有回复",
    linkCopied: "链接已复制。",
    reported: "已收到举报。",
    blocked: "已屏蔽用户。",
    unblocked: "已取消屏蔽。",
  },
  en: {
    profile: "Profile",
    backHome: "Back home",
    editProfile: "Edit Profile",
    follow: "Follow",
    block: "Block user",
    unblock: "Unblock",
    following: "Following",
    moreActions: "More profile actions",
    joined: "Joined",
    followers: "followers",
    followingStat: "following",
    postsStat: "posts",
    profileSections: "Profile sections",
    posts: "Posts",
    replies: "Replies",
    userPosts: "User posts",
    userNotFound: "User not found.",
    pleaseLogIn: "Please log in first.",
    loading: "Loading...",
    noReplies: "No replies yet",
    linkCopied: "链接已复制。",
    reported: "Report received.",
    blocked: "User blocked.",
    unblocked: "User unblocked.",
  },
  ja: {
    profile: "プロフィール",
    backHome: "ホームへ戻る",
    editProfile: "プロフィールを編集",
    follow: "フォロー",
    block: "ブロック",
    unblock: "ブロック解除",
    following: "フォロー中",
    moreActions: "プロフィールのその他操作",
    joined: "登録日",
    followers: "フォロワー",
    followingStat: "フォロー中",
    postsStat: "投稿",
    profileSections: "プロフィール項目",
    posts: "投稿",
    replies: "返信",
    userPosts: "ユーザーの投稿",
    userNotFound: "ユーザーが見つかりません。",
    pleaseLogIn: "先にログインしてください。",
    loading: "読み込み中...",
    noReplies: "まだ返信がありません",
    linkCopied: "リンクをコピーしました。",
    reported: "報告を受け付けました。",
    blocked: "ユーザーをブロックしました。",
    unblocked: "ブロックを解除しました。",
  },
};

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

type UserResponse = {
  user?: AppUser;
  posts?: AppPost[];
  viewer?: AppUser | null;
  error?: string;
};

export default function PublicUserPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [user, setUser] = useState<AppUser | null>(null);
  const [viewer, setViewer] = useState<AppUser | null>(null);
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [tab, setTab] = useState<"posts" | "replies">("posts");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("zh");
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const text = copy[locale];

  useEffect(() => {
    async function loadUser() {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

      if (isLocale(savedLocale)) {
        setLocale(savedLocale);
      }

      const response = await fetch(`/api/users/${username}`);
      const data = (await response.json().catch(() => null)) as UserResponse | null;

      if (!response.ok || !data?.user) {
        setNotice(data?.error ?? copy[isLocale(savedLocale) ? savedLocale : "zh"].userNotFound);
      } else {
        setUser(data.user);
        setPosts(data.posts ?? []);
        setViewer(data.viewer ?? null);

        if (!isLocale(savedLocale) && (data.viewer?.language || data.user.language)) {
          setLocale(data.viewer?.language ?? data.user.language);
        }
      }

      setLoading(false);
    }

    loadUser();
  }, [username]);

  async function handleFollow() {
    if (!user) {
      return;
    }

    const response = await fetch(`/api/users/${user.username}/follow`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as {
      following?: boolean;
      followers?: number;
      error?: string;
    } | null;

    if (!response.ok || typeof data?.following !== "boolean") {
      setNotice(data?.error ?? text.pleaseLogIn);
      return;
    }

    setUser({
      ...user,
      followedByViewer: data.following,
      stats: {
        followers: String(data.followers ?? user.stats?.followers ?? "0"),
        following: user.stats?.following ?? "0",
        posts: user.stats?.posts ?? String(posts.length),
      },
    });
  }

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

  async function handleBlockUser() {
    if (!user) {
      return;
    }

    const response = await fetch(`/api/users/${user.username}/block`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { blocked?: boolean; error?: string } | null;

    if (!response.ok || typeof data?.blocked !== "boolean") {
      setNotice(data?.error ?? text.pleaseLogIn);
      return;
    }

    setUser({ ...user, blockedByViewer: data.blocked, followedByViewer: data.blocked ? false : user.followedByViewer });
    setPosts(data.blocked ? [] : posts);
    setNotice(data.blocked ? text.blocked : text.unblocked);
  }

  const isSelf = viewer?.id === user?.id;

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header">
          <Link href="/" aria-label={text.backHome}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{user?.displayName ?? text.profile}</h1>
            <p>{user ? `@${user.username}` : ""}</p>
          </div>
          <span />
        </header>

        {notice ? <div className="empty-state">{notice}</div> : null}
        {loading ? <div className="empty-state">{text.loading}</div> : null}

        {user ? (
          <>
            <section className="profile-hero">
              <div className="profile-cover" />
              <div className="profile-hero-main">
                <div className={user.avatarUrl ? "profile-avatar-xl image-avatar" : "profile-avatar-xl"}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.displayName)}
                </div>
                <div className="profile-controls">
                  {isSelf ? (
                    <Link href="/profile/edit">{text.editProfile}</Link>
                  ) : (
                    <>
                      <button
                        className={user.followedByViewer ? "following-button" : undefined}
                        type="button"
                        onClick={handleFollow}
                        disabled={user.blockedByViewer}
                      >
                        {user.followedByViewer ? text.following : text.follow}
                      </button>
                      <button className="danger-action" type="button" onClick={handleBlockUser}>
                        {user.blockedByViewer ? text.unblock : text.block}
                      </button>
                    </>
                  )}
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
                <div className="profile-stats">
                  <Link className="profile-stat-link" href={`/users/${user.username}/follows?tab=followers`}>
                    <strong>{user.stats?.followers ?? "0"}</strong> {text.followers}
                  </Link>
                  <Link className="profile-stat-link" href={`/users/${user.username}/follows?tab=following`}>
                    <strong>{user.stats?.following ?? "0"}</strong> {text.followingStat}
                  </Link>
                  <span>
                    <strong>{user.stats?.posts ?? String(posts.length)}</strong> {text.postsStat}
                  </span>
                </div>
                {user.description ? <p className="profile-description">{user.description}</p> : null}
              </div>
              <div className="profile-tabs two-tabs" role="tablist" aria-label={text.profileSections}>
                <button
                  className={tab === "posts" ? "active" : undefined}
                  type="button"
                  role="tab"
                  aria-selected={tab === "posts"}
                  onClick={() => setTab("posts")}
                >
                  {text.posts}
                </button>
                <button
                  className={tab === "replies" ? "active" : undefined}
                  type="button"
                  role="tab"
                  aria-selected={tab === "replies"}
                  onClick={() => setTab("replies")}
                >
                  {text.replies}
                </button>
              </div>
            </section>

            {tab === "replies" ? (
              <div className="empty-state detail-empty">
                <ImageIcon size={42} />
                <span>{text.noReplies}</span>
              </div>
            ) : null}

            <section className="timeline" aria-label={text.userPosts}>
              {(tab === "posts" ? posts : []).map((post) => (
                <UserPostCard
                  key={post.id}
                  post={post}
                  onOpen={() => router.push(`/posts/${post.id}`)}
                  onBookmark={handleToggleBookmark}
                  onRepost={handleToggleRepost}
                  onView={handleRecordView}
                  onShare={handleShare}
                  onReport={setReportPostId}
                />
              ))}
            </section>
          </>
        ) : null}
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

function UserPostCard({
  post,
  onOpen,
  onBookmark,
  onRepost,
  onView,
  onShare,
  onReport,
}: {
  post: AppPost;
  onOpen: () => void;
  onBookmark: (postId: string) => void;
  onRepost: (postId: string) => void;
  onView: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
}) {
  return (
    <article className="post-card clickable-post" role="link" tabIndex={0} onClick={onOpen}>
      <div className={post.authorAvatarUrl ? "avatar small image-avatar" : "avatar small"}>
        {post.authorAvatarUrl ? <img src={post.authorAvatarUrl} alt="" /> : post.author.slice(0, 2).toUpperCase()}
      </div>
      <div className="post-content">
        <div className="post-meta">
          <div>
            <strong>{post.author}</strong>
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
              onRepost(post.id);
            }}
          >
            <Repeat2 size={18} />
            <span>{post.stats.reposts}</span>
          </button>
          <button type="button" className={post.liked ? "action-active like-active" : undefined} onClick={(event) => event.stopPropagation()}>
            <Heart size={18} />
            <span>{post.stats.likes}</span>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onView(post.id);
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
              onBookmark(post.id);
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
