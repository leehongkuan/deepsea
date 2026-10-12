"use client";

import { ArrowLeft, Bell, Heart, MessageCircle, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/shared";

type AppNotification = {
  id: string;
  type: "like" | "comment" | "repost" | string;
  createdAt: string;
  read: boolean;
  actor: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  post: {
    id: string;
    body: string;
  };
};

const LOCALE_STORAGE_KEY = "deepsea_locale";

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
}

const copy = {
  zh: {
    title: "通知",
    subtitle: "评论、转发和点赞",
    loading: "加载中...",
    empty: "还没有通知。",
    login: "请先登录。",
    like: "点赞了你的帖子",
    comment: "评论了你的帖子",
    repost: "转发了你的帖子",
  },
  en: {
    title: "Notifications",
    subtitle: "Comments, reposts, and likes",
    loading: "Loading...",
    empty: "No notifications yet.",
    login: "Please log in first.",
    like: "liked your post",
    comment: "commented on your post",
    repost: "reposted your post",
  },
  ja: {
    title: "通知",
    subtitle: "コメント、リポスト、いいね",
    loading: "読み込み中...",
    empty: "通知はまだありません。",
    login: "先にログインしてください。",
    like: "あなたの投稿にいいねしました",
    comment: "あなたの投稿にコメントしました",
    repost: "あなたの投稿をリポストしました",
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("zh");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const text = copy[locale];

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (isLocale(savedLocale)) {
      setLocale(savedLocale);
    }

    async function loadNotifications() {
      const response = await fetch("/api/notifications");
      const data = (await response.json().catch(() => null)) as {
        notifications?: AppNotification[];
        error?: string;
      } | null;

      if (!response.ok || !data?.notifications) {
        setNotice(copy[isLocale(savedLocale) ? savedLocale : "zh"].login);
      } else {
        setNotifications(data.notifications);
      }

      setLoading(false);
    }

    loadNotifications();
  }, []);

  function messageFor(type: AppNotification["type"]) {
    if (type === "comment") return text.comment;
    if (type === "repost") return text.repost;
    return text.like;
  }

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
          <Bell size={24} />
        </header>

        {loading ? <div className="empty-state">{text.loading}</div> : null}
        {!loading && notice ? <div className="empty-state">{notice}</div> : null}
        {!loading && !notice && notifications.length === 0 ? <div className="empty-state">{text.empty}</div> : null}

        <section className="notification-list" aria-label={text.title}>
          {notifications.map((notification) => {
            const Icon = notification.type === "comment" ? MessageCircle : notification.type === "repost" ? Repeat2 : Heart;

            return (
              <article
                className={notification.read ? "notification-card" : "notification-card unread"}
                key={notification.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/posts/${notification.post.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(`/posts/${notification.post.id}`);
                }}
              >
                <Icon size={22} />
                <div className={notification.actor.avatarUrl ? "avatar small image-avatar" : "avatar small"}>
                  {notification.actor.avatarUrl ? (
                    <img src={notification.actor.avatarUrl} alt="" />
                  ) : (
                    notification.actor.displayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p>
                    <strong>{notification.actor.displayName}</strong>
                    <span> @{notification.actor.username} </span>
                    {messageFor(notification.type)}
                    <span> · {formatRelativeTime(notification.createdAt)}</span>
                  </p>
                  <p className="notification-post-preview">{notification.post.body.slice(0, 160)}</p>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
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
