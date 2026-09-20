import { useCommunityPosts } from '../community/CommunityPostsContext';
import { useParams } from 'react-router-dom';
import { useAllCommunityPosts } from '../community/communitySelectors';
import { useBookmarks } from '../bookmarks/BookmarkContext';
import { useAppNavigation } from '../navigation/AppNavigation';
import { CommunityPostDetailPanel } from '../components/CommunityPostDetailPanel';
import { SubPageHeader } from '../components/SubPageHeader';
export function CommunityPostPage() {
  const { id } = useParams();
  const posts = useAllCommunityPosts();
  const post = posts.find(item => item.id === id);
  const bookmarks = useBookmarks();
  const navigation = useAppNavigation();
  const { likedPostIds, togglePostLike } = useCommunityPosts();
  const close = () => navigation?.goBack('community');
  if (!post || !post.body) return <div className="community app">
    <SubPageHeader title="커뮤니티" backLabel="커뮤니티로" onBack={close} preserveBellPlacement />
    <main className="community__scroll"><p>게시글을 찾을 수 없어요.</p></main>
  </div>;
  return <div className="community app"><CommunityPostDetailPanel post={post} open onClose={close}
    liked={likedPostIds.includes(post.id)} onToggleLike={() => togglePostLike(post.id)}
    saved={bookmarks.isSaved(post.id)} onToggleSave={() => bookmarks.toggle(post.id)} />
  </div>;
}
