"use client";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  ImageIcon,
  Repeat2,
  Share,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ComposerBox, type ComposerMedia } from "@/app/components/ComposerBox";
import { ComposerMediaPreview, MediaGrid } from "@/app/components/MediaGrid";
import { ReportDialog } from "@/app/components/ReportDialog";
import type { AppComment, AppPost, AppUser, Locale } from "@/lib/shared";

const LOCALE_STORAGE_KEY = "deepsea_locale";

const copy = {
  zh: {
    title: "Post",
    comments: "评论",
    loading: "加载中...",
    postNotFound: "找不到这个 post。",
    loadFailed: "无法加载这个 post。",
    loginToComment: "注册或登录后才能评论。",
    commentFailed: "评论失败。",
    copied: "链接已复制。",
    emptyPost: "Post 不能为空。",
    editFailed: "编辑失败。",
    mediaLimit: "最多只能上传 9 个图片或视频。",
    uploadFailed: "上传失败。",
    deleteFailed: "删除失败。",
    more: "更多",
    edit: "编辑",
    delete: "删除",
    media: "媒体",
    cancel: "取消",
    save: "保存",
    replyPlaceholder: "发布你的回复",
    reply: "回复",
    helper: "最多 5000 字",
    noComments: "还没有评论。",
    deleteTitle: "删除这个 post？",
    deleteBody: "确认后这个 post 会从时间线和详情页中删除。",
    report: "举报",
    reported: "已收到举报。",
  },
  en: {
    title: "Post",
    comments: "comments",
    loading: "Loading...",
    postNotFound: "Post not found.",
    loadFailed: "Could not load this post.",
    loginToComment: "Please sign up or log in to comment.",
    commentFailed: "Comment failed.",
    copied: "Link copied.",
    emptyPost: "Post cannot be empty.",
    editFailed: "Edit failed.",
    mediaLimit: "You can upload up to 9 images or videos.",
    uploadFailed: "Upload failed.",
    deleteFailed: "Delete failed.",
    more: "More",
    edit: "Edit",
    delete: "Delete",
    media: "Media",
    cancel: "Cancel",
    save: "Save",
    replyPlaceholder: "Post your reply",
    reply: "Reply",
    helper: "Up to 5000 characters",
    noComments: "No comments yet.",
    deleteTitle: "Delete this post?",
    deleteBody: "This post will be removed from the timeline and detail page.",
    report: "Report",
    reported: "Report received.",
  },
  ja: {
    title: "投稿",
    comments: "コメント",
    loading: "読み込み中...",
    postNotFound: "投稿が見つかりません。",
    loadFailed: "投稿を読み込めませんでした。",
    loginToComment: "コメントするには登録またはログインしてください。",
    commentFailed: "コメントに失敗しました。",
    copied: "リンクをコピーしました。",
    emptyPost: "投稿は空にできません。",
    editFailed: "編集に失敗しました。",
    mediaLimit: "画像または動画は最大9個までアップロードできます。",
    uploadFailed: "アップロードに失敗しました。",
    deleteFailed: "削除に失敗しました。",
    more: "その他",
    edit: "編集",
    delete: "削除",
    media: "メディア",
    cancel: "キャンセル",
    save: "保存",
    replyPlaceholder: "返信を投稿",
    reply: "返信",
    helper: "最大5000文字",
    noComments: "コメントはまだありません。",
    deleteTitle: "この投稿を削除しますか？",
    deleteBody: "この投稿はタイムラインと詳細ページから削除されます。",
    report: "報告",
    reported: "報告を受け付けました。",
  },
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [post, setPost] = useState<AppPost | null>(null);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editMedia, setEditMedia] = useState<ComposerMedia[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [locale, setLocale] = useState<Locale>("zh");
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const text = copy[locale];

  useEffect(() => {
    async function loadPost() {
      try {
        const [meResponse, postResponse] = await Promise.all([fetch("/api/auth/me"), fetch(`/api/posts/${postId}`)]);
        const meData = (await meResponse.json()) as { user: AppUser | null };
        const postData = (await postResponse.json()) as {
          post?: AppPost;
          comments?: AppComment[];
          error?: string;
        };

        setCurrentUser(meData.user);
        const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

        if (isLocale(savedLocale)) {
          setLocale(savedLocale);
        } else if (meData.user?.language) {
          setLocale(meData.user.language);
        }

        if (!postResponse.ok) {
          setNotice(postData.error ?? text.postNotFound);
          return;
        }

        setPost(postData.post ?? null);
        setEditText(postData.post?.body ?? "");
        setEditMedia(mediaFromPost(postData.post));
        setComments(postData.comments ?? []);

        if (postData.post) {
          const viewResponse = await fetch(`/api/posts/${postId}/view`, { method: "POST" });
          const viewData = (await viewResponse.json().catch(() => null)) as { viewCount?: number } | null;

          if (viewResponse.ok && typeof viewData?.viewCount === "number") {
            setPost((value) =>
              value ? { ...value, stats: { ...value.stats, views: String(viewData.viewCount) } } : value,
            );
          }
        }
      } catch {
        setNotice(text.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId, text.loadFailed, text.postNotFound]);

  useEffect(() => {
    function syncLocale(event: StorageEvent) {
      if (event.key === LOCALE_STORAGE_KEY && isLocale(event.newValue)) {
        setLocale(event.newValue);
      }
    }

    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  async function handleCommentSubmit(payload: { body: string; media: ComposerMedia[] }) {
    if (!currentUser) {
      setNotice(text.loginToComment);
      return false;
    }

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as {
      comment?: AppComment;
      commentCount?: number;
      error?: string;
    } | null;

    if (!response.ok || !data?.comment) {
      setNotice(data?.error ?? text.commentFailed);
      return false;
    }

    setComments((items) => [...items, data.comment as AppComment]);
    setPost((item) =>
      item
        ? {
            ...item,
            stats: {
              ...item.stats,
              replies: String(data.commentCount ?? comments.length + 1),
            },
          }
        : item,
    );
    setNotice("");
    return true;
  }

  async function handleToggleLike() {
    if (!post) {
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { liked?: boolean; likeCount?: number; error?: string } | null;

    if (!response.ok || typeof data?.liked !== "boolean") {
      setNotice(data?.error ?? "Please log in first.");
      return;
    }

    setPost({
      ...post,
      liked: data.liked,
      stats: { ...post.stats, likes: String(data.likeCount ?? post.stats.likes) },
    });
  }

  async function handleToggleBookmark() {
    if (!post) {
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as {
      bookmarked?: boolean;
      bookmarkCount?: number;
      error?: string;
    } | null;

    if (!response.ok || typeof data?.bookmarked !== "boolean") {
      setNotice(data?.error ?? "Please log in first.");
      return;
    }

    setPost({
      ...post,
      bookmarked: data.bookmarked,
      stats: { ...post.stats, bookmarks: String(data.bookmarkCount ?? post.stats.bookmarks ?? "0") },
    });
  }

  async function handleToggleRepost() {
    if (!post) {
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/repost`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { reposted?: boolean; repostCount?: number; error?: string } | null;

    if (!response.ok || typeof data?.reposted !== "boolean") {
      setNotice(data?.error ?? "Please log in first.");
      return;
    }

    setPost({
      ...post,
      reposted: data.reposted,
      stats: { ...post.stats, reposts: String(data.repostCount ?? post.stats.reposts) },
    });
  }

  async function handleRecordView() {
    if (!post) {
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/view`, { method: "POST" });
    const data = (await response.json().catch(() => null)) as { viewCount?: number } | null;

    if (!response.ok || typeof data?.viewCount !== "number") {
      return;
    }

    setPost({
      ...post,
      stats: { ...post.stats, views: String(data.viewCount) },
    });
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice(text.copied);
    } catch {
      setNotice(window.location.href);
    }
  }

  async function submitReport(reason: string) {
    if (!reportTarget) {
      return;
    }

    const endpoint =
      reportTarget.type === "post"
        ? `/api/posts/${reportTarget.id}/report`
        : `/api/comments/${reportTarget.id}/report`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setNotice(data?.error ?? text.loginToComment);
      return;
    }

    setReportTarget(null);
    setNotice(text.reported);
  }

  async function handleSaveEdit() {
    if (!post || savingEdit) {
      return;
    }

    const text = editText.trim();

    if (!text && editMedia.length === 0) {
      setNotice(copy[locale].emptyPost);
      return;
    }

    setSavingEdit(true);
    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, media: editMedia }),
    });
    const data = (await response.json().catch(() => null)) as { post?: AppPost; error?: string } | null;
    setSavingEdit(false);

    if (!response.ok || !data?.post) {
      setNotice(data?.error ?? copy[locale].editFailed);
      return;
    }

    setPost(data.post);
    setEditText(data.post.body);
    setEditMedia(mediaFromPost(data.post));
    setEditing(false);
    setNotice("");
  }

  async function handleEditMediaSelection(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const incoming = Array.from(files);

    if (editMedia.length + incoming.length > 9) {
      setNotice(text.mediaLimit);
      return;
    }

    const uploaded: ComposerMedia[] = [];

    for (const file of incoming) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setNotice(data?.error ?? text.uploadFailed);
        continue;
      }

      const data = (await response.json()) as { media: ComposerMedia };
      uploaded.push(data.media);
    }

    if (uploaded.length > 0) {
      setEditMedia((items) => [...items, ...uploaded].slice(0, 9));
      setNotice("");
    }

    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function startEditing() {
    if (!post) {
      return;
    }

    setEditText(post.body);
    setEditMedia(mediaFromPost(post));
    setEditing(true);
  }

  async function handleDeletePost() {
    if (!post) {
      return;
    }

    const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setNotice(data?.error ?? text.deleteFailed);
      setConfirmingDelete(false);
      return;
    }

    router.push("/");
  }

  const displayName = currentUser?.displayName ?? "Guest";
  const canManagePost = Boolean(currentUser && post && currentUser.id === post.authorId);

  return (
    <main className="detail-shell">
      <section className="detail-panel">
        <header className="detail-header">
          <Link href="/" aria-label="Back home">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1>{text.title}</h1>
            <p>{post ? `${post.stats.replies} ${text.comments}` : ""}</p>
          </div>
          <span />
        </header>

        {loading ? <div className="empty-state">{text.loading}</div> : null}
        {!loading && notice && !post ? <div className="empty-state">{notice}</div> : null}

        {post ? (
          <>
            <article className="post-card detail-post">
              <button
                className={post.authorAvatarUrl ? "avatar small image-avatar avatar-button" : "avatar small avatar-button"}
                type="button"
                onClick={() => router.push(`/users/${post.authorUsername}`)}
              >
                {post.authorAvatarUrl ? <img src={post.authorAvatarUrl} alt="" /> : post.author.slice(0, 2).toUpperCase()}
              </button>
              <div className="post-content">
                <div className="post-meta">
                  <div>
                    <button className="author-link-button" type="button" onClick={() => router.push(`/users/${post.authorUsername}`)}>
                      {post.author}
                    </button>
                    <span>{post.handle}</span>
                    <span title={formatExactTime(post.createdAt)}>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <button title={text.more}>
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {editing ? (
                  <div className="edit-post-panel">
                    <textarea
                      maxLength={5000}
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                        aria-label={text.edit}
                    />
                    <ComposerMediaPreview
                      media={editMedia}
                      onRemove={(url) => setEditMedia((items) => items.filter((item) => item.url !== url))}
                    />
                    <div className="edit-post-actions">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,video/mp4,video/webm,video/quicktime"
                        multiple
                        hidden
                        onChange={(event) => handleEditMediaSelection(event.target.files)}
                      />
                      <button
                        type="button"
                        className="edit-media-button"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <ImageIcon size={18} />
                        <span>{text.media}</span>
                      </button>
                      <span className={5000 - editText.length < 120 ? "counter danger" : "counter"}>
                        {5000 - editText.length}
                      </span>
                      <button type="button" className="secondary-action" onClick={() => {
                        setEditText(post.body);
                        setEditMedia(mediaFromPost(post));
                        setEditing(false);
                      }}>
                        {text.cancel}
                      </button>
                      <button type="button" className="primary-action" onClick={handleSaveEdit} disabled={savingEdit}>
                        {text.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="post-body detail-post-body">{post.body}</p>
                )}
                <MediaGrid media={post.media} />

                <div className={canManagePost ? "action-bar detail-action-bar" : "action-bar"}>
                  <button type="button">
                    <MessageCircle size={18} />
                    <span>{post.stats.replies}</span>
                  </button>
                  <button className={post.reposted ? "action-active repost-active" : undefined} type="button" onClick={handleToggleRepost}>
                    <Repeat2 size={18} />
                    <span>{post.stats.reposts}</span>
                  </button>
                  <button
                    className={post.liked ? "action-active like-active" : undefined}
                    type="button"
                    onClick={handleToggleLike}
                  >
                    <Heart size={18} />
                    <span>{post.stats.likes}</span>
                  </button>
                  <button type="button" onClick={handleRecordView}>
                    <BarChart3 size={18} />
                    <span>{post.stats.views}</span>
                  </button>
                  <button
                    className={post.bookmarked ? "action-active" : undefined}
                    type="button"
                    onClick={handleToggleBookmark}
                  >
                    <Bookmark fill={post.bookmarked ? "currentColor" : "none"} size={18} />
                  </button>
                  <button type="button" onClick={handleShare}>
                    <Share size={18} />
                  </button>
                  <button type="button" onClick={() => setReportTarget({ type: "post", id: post.id })} title={text.report}>
                    <Flag size={18} />
                  </button>
                  {canManagePost ? (
                    <>
                      <button type="button" onClick={startEditing} title={text.edit}>
                        <Pencil size={18} />
                      </button>
                      <button
                        className="danger-action"
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        title={text.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>

            <ComposerBox
              avatar={currentUser?.avatarUrl ?? initials(displayName)}
              placeholder={text.replyPlaceholder}
              submitLabel={text.reply}
              helperText={text.helper}
              disabled={!currentUser}
              notice={notice}
              onNotice={setNotice}
              onSubmit={handleCommentSubmit}
            />

            <section className="comment-list" aria-label="Comments">
              {comments.length === 0 ? <div className="empty-state">{text.noComments}</div> : null}
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  reportLabel={text.report}
                  onReport={() => setReportTarget({ type: "comment", id: comment.id })}
                />
              ))}
            </section>
          </>
        ) : null}
      </section>
      {confirmingDelete ? (
        <div className="confirm-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-post-title">
            <h2 id="delete-post-title">{text.deleteTitle}</h2>
            <p>{text.deleteBody}</p>
            <div className="confirm-actions">
              <button type="button" className="secondary-action" onClick={() => setConfirmingDelete(false)}>
                {text.cancel}
              </button>
              <button type="button" className="danger-button" onClick={handleDeletePost}>
                {text.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ReportDialog
        locale={locale}
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </main>
  );
}

function CommentCard({
  comment,
  reportLabel,
  onReport,
}: {
  comment: AppComment;
  reportLabel: string;
  onReport: () => void;
}) {
  return (
    <article className="post-card comment-card">
      <div className={comment.authorAvatarUrl ? "avatar small image-avatar" : "avatar small"}>
        {comment.authorAvatarUrl ? <img src={comment.authorAvatarUrl} alt="" /> : comment.author.slice(0, 2).toUpperCase()}
      </div>
      <div className="post-content">
        <div className="post-meta">
          <div>
            <strong>{comment.author}</strong>
            <span>{comment.handle}</span>
            <span title={formatExactTime(comment.createdAt)}>{formatRelativeTime(comment.createdAt)}</span>
          </div>
        </div>
        <p className="post-body">{comment.body}</p>
        <MediaGrid media={comment.media} />
        <div className="action-bar">
          <button type="button" title={reportLabel} onClick={onReport}>
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

function mediaFromPost(post?: AppPost): ComposerMedia[] {
  return post?.media ?? [];
}

function isLocale(value: string | null): value is Locale {
  return value === "zh" || value === "en" || value === "ja";
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

function formatExactTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
