export type Locale = "zh" | "en" | "ja";

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  language: Locale;
  avatarUrl: string | null;
  description: string | null;
  ipLocation: string | null;
  createdAt: string;
  invalidatedAt?: string | null;
  stats?: {
    followers: string;
    following: string;
    posts: string;
  };
  followedByViewer?: boolean;
  blockedByViewer?: boolean;
};

export type AppFollowUser = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  description: string | null;
  followedByViewer: boolean;
  followsViewer: boolean;
  isViewer: boolean;
};

export type AppPost = {
  timelineId?: string;
  id: string;
  authorId: string;
  author: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  handle: string;
  body: string;
  createdAt: string;
  media?: AppMedia[];
  liked?: boolean;
  bookmarked?: boolean;
  reposted?: boolean;
  repostedBy?: string;
  repostedAt?: string;
  stats: {
    replies: string;
    reposts: string;
    likes: string;
    views: string;
    bookmarks?: string;
  };
};

export type AppMedia = {
  type: "image" | "video";
  url: string;
};

export type AppComment = {
  id: string;
  authorId: string;
  author: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  handle: string;
  body: string;
  createdAt: string;
  media?: AppMedia[];
};
