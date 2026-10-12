import type { AppComment, AppPost } from "@/lib/shared";

type PostForApp = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: {
    type: string;
    url: string;
  }[];
  _count: {
    comments?: number;
    likes: number;
    bookmarks: number;
    reposts?: number;
    views?: number;
  };
  likes?: {
    userId: string;
  }[];
  bookmarks?: {
    userId: string;
  }[];
  reposts?: {
    userId: string;
  }[];
};

export function toAppPost(
  post: PostForApp,
  viewerId?: string | null,
  options?: {
    timelineId?: string;
    repostedBy?: string;
    repostedAt?: Date;
  },
): AppPost {
  const liked = viewerId ? Boolean(post.likes?.some((like) => like.userId === viewerId)) : false;
  const bookmarked = viewerId
    ? Boolean(post.bookmarks?.some((bookmark) => bookmark.userId === viewerId))
    : false;
  const reposted = viewerId ? Boolean(post.reposts?.some((repost) => repost.userId === viewerId)) : false;

  return {
    timelineId: options?.timelineId,
    id: post.id,
    authorId: post.author.id,
    author: post.author.displayName,
    authorUsername: post.author.username,
    authorAvatarUrl: post.author.avatarUrl,
    handle: `@${post.author.username}`,
    body: post.body,
    createdAt: post.createdAt.toISOString(),
    media: post.media.map((media) => ({
      type: media.type === "video" ? "video" : "image",
      url: media.url,
    })),
    liked,
    bookmarked,
    reposted,
    repostedBy: options?.repostedBy,
    repostedAt: options?.repostedAt?.toISOString(),
    stats: {
      replies: String(post._count.comments ?? 0),
      reposts: String(post._count.reposts ?? 0),
      likes: String(post._count.likes),
      views: String(post._count.views ?? 0),
      bookmarks: String(post._count.bookmarks),
    },
  };
}

type CommentForApp = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: {
    type: string;
    url: string;
  }[];
};

export function toAppComment(comment: CommentForApp): AppComment {
  return {
    id: comment.id,
    authorId: comment.author.id,
    author: comment.author.displayName,
    authorUsername: comment.author.username,
    authorAvatarUrl: comment.author.avatarUrl,
    handle: `@${comment.author.username}`,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    media: comment.media.map((media) => ({
      type: media.type === "video" ? "video" : "image",
      url: media.url,
    })),
  };
}
