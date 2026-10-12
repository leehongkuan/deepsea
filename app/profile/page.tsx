import { PostListPage } from "@/app/components/PostListPage";

export default function ProfilePage() {
  return <PostListPage title="Profile" endpoint="/api/profile" emptyText="No posts yet" mode="profile" />;
}
