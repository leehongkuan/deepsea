import { PostListPage } from "@/app/components/PostListPage";

export default function BookmarksPage() {
  return <PostListPage title="Bookmarks" endpoint="/api/bookmarks" emptyText="No bookmarks yet" mode="bookmarks" />;
}
