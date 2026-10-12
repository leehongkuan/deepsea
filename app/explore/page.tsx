"use client";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Search,
  Share,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MediaGrid } from "@/app/components/MediaGrid";
import { ReportDialog } from "@/app/components/ReportDialog";
import type { AppPost, Locale } from "@/lib/shared";

const LOCALE_STORAGE_KEY = "deepsea_locale";

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

const copy = {
  zh: {
    title: "探索",
    subtitle: "搜索帖子、作者和用户名",
    search: "搜索帖子",
    placeholder: "输入关键词",
    button: "搜索",
    loading: "搜索中...",
    empty: "没有找到相关帖子。",
    start: "输入关键词搜索帖子。",
    loadFailed: "搜索失败，请稍后重试。",
    authRequired: "请先登录。",
    copied: "链接已复制。",
    showMore: "展开全文",
    showLess: "收起",
    report: "举报",
    reported: "已收到举报。",
  },
  en: {
    title: "Explore",
    subtitle: "Search posts, authors, and handles",
    search: "Search posts",
    placeholder: "Enter keywords",
    button: "Search",
    loading: "Searching...",
    empty: "No matching posts found.",
    start: "Enter keywords to search posts.",
    loadFailed: "Search failed. Please try again.",
    authRequired: "Please log in first.",
    copied: "Link copied.",
    showMore: "Show more",
    showLess: "Show less",
    report: "Report",
    reported: "Report received.",
  },
  ja: {
    title: "探す",
    subtitle: "投稿、作者、ハンドルを検索",
    search: "投稿を検索",
    placeholder: "キーワードを入力",
    button: "検索",
    loading: "検索中...",
    empty: "一致する投稿はありません。",
    start: "キーワードを入力して投稿を検索します。",
    loadFailed: "検索できませんでした。もう一度お試しください。",
    authRequired: "先にログインしてください。",
    copied: "リンクをコピーしました。",
    showMore: "さらに表示",
    showLess: "閉じる",
    report: "報告",
    reported: "報告を受け付けました。",
  },
};

export default function ExplorePage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const text = copy[locale];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (isLocale(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = query.trim();

    setSearchedQuery(trimmed);
    setNotice("");

    if (!trimmed) {
      setPosts([]);
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/posts?q=${encodeURIComponent(trimmed)}`);
    const data = (await response.json().catch(() => null)) as { posts?: AppPost[]; error?: string } | null;
    setLoading(false);

    if (!response.ok || !data?.posts) {
      setNotice(text.loadFailed);
      return;
    }

    setPosts(data.posts);
  }

  async function handleToggleLike(postId: string) {
    const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });

    if (!response.ok) {
      setNotice(text.authRequired);
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
      setNotice(text.authRequired);
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
    setPosts((items) =>
      items.map((post) =>
        post.id === postId
          ? { ...post, reposted: data.reposted, stats: { ...post.stats, reposts: String(data.repostCount) } }
          : post,
      ),
    );
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
      setNotice(text.copied);
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

  const emptyText = useMemo(() => {
    if (loading) return text.loading;
    if (notice) return notice;
    if (!searchedQuery) return text.start;
    return text.empty;
  }, [loading, notice, searchedQuery, text]);

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header">
          <Link href="/" aria-label="Back home">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{text.title}</h1>
            <p>{text.subtitle}</p>
          </div>
          <img className="detail-header-logo" src="/deepsea-logo.svg" alt="" />
        </header>

        <form className="explore-search" onSubmit={handleSearch}>
          <label>
            <Search size={20} />
            <input
              aria-label={text.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.placeholder}
            />
          </label>
          <button type="submit" disabled={loading}>
            {text.button}
          </button>
        </form>

        {posts.length === 0 ? <div className="empty-state">{emptyText}</div> : null}

        <section aria-label={text.search}>
          {posts.map((post) => (
            <ExplorePostCard
              key={post.id}
              labels={text}
              post={post}
              onShare={handleShare}
              onToggleBookmark={handleToggleBookmark}
              onToggleLike={handleToggleLike}
              onToggleRepost={handleToggleRepost}
              onRecordView={handleRecordView}
              onReport={setReportPostId}
            />
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

function ExplorePostCard({
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
  const shouldCollapse = post.body.length > 200;
  const visibleBody = shouldCollapse && !expanded ? `${post.body.slice(0, 200)}...` : post.body;

  return (
    <article className="post-card clickable-post" role="link" tabIndex={0} onClick={() => router.push(`/posts/${post.id}`)}>
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

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
