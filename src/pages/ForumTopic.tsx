import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Home, ChevronRight, ThumbsUp, MessageSquare, Eye, Clock, 
  CheckCircle, Edit, Trash2, Reply, MoreVertical, Pin, Lock, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { 
  getTopicBySlug, 
  getReplies, 
  createReply, 
  toggleLike,
  incrementTopicViewCount,
  updateTopic,
  deleteTopic,
  ForumTopic,
  ForumReply
} from '@/services/forumService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ForumTopic = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit topic state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);
  
  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (slug) {
      loadTopic();
    }
  }, [slug]);

  const loadTopic = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const { data: topicData } = await getTopicBySlug(slug);
      if (topicData) {
        setTopic(topicData);
        incrementTopicViewCount(topicData.id);
        
        const { data: repliesData } = await getReplies(topicData.id);
        setReplies(repliesData);
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      toast.error('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await createReply({
        topic_id: topic.id,
        content: replyContent.trim(),
        parent_reply_id: replyingTo
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Reply posted!');
        setReplyContent('');
        setReplyingTo(null);
        await loadTopic();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (topicId?: string, replyId?: string) => {
    if (!user) {
      toast.error('Please sign in to like');
      return;
    }

    try {
      await toggleLike(topicId, replyId);
      await loadTopic();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const isAuthor = (authorId: string) => {
    return user?.id === authorId;
  };

  const isModerator = () => {
    return profile?.is_super_admin || profile?.user_role === 'moderator' || profile?.user_role === 'admin';
  };

  const handleEditTopic = () => {
    if (!topic) return;
    setEditTitle(topic.title);
    setEditContent(topic.content);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!topic || !editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setEditing(true);
    try {
      const { error } = await updateTopic(topic.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Topic updated successfully!');
        setShowEditDialog(false);
        await loadTopic();
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Failed to update topic');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteTopic = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!topic) return;

    setDeleting(true);
    try {
      const { error } = await deleteTopic(topic.id);

      if (error) {
        toast.error(error);
      } else {
        toast.success('Topic deleted successfully');
        navigate('/forum');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const renderReply = (reply: ForumReply, depth: number = 0) => {
    const marginLeft = Math.min(depth * 32, 96); // Max 3 levels deep

    return (
      <div key={reply.id} style={{ marginLeft: `${marginLeft}px` }} className="mb-4">
        <Card className="border-2 border-[#FFA500]/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Author Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center text-white font-bold">
                  {reply.author?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              {/* Reply Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#0A2463]">{reply.author?.name || 'Anonymous'}</span>
                    <span className="text-xs text-[#0A2463]/50">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                    {reply.is_edited && (
                      <Badge variant="outline" className="text-xs">Edited</Badge>
                    )}
                    {reply.is_solution && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Solution
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actions Dropdown */}
                  {user && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setReplyingTo(reply.id)}>
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        {(isAuthor(reply.author_id) || isModerator()) && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {(isAuthor(topic?.author_id || '') || isModerator()) && !reply.is_solution && (
                          <DropdownMenuItem>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Solution
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="prose prose-sm max-w-none mb-4 text-[#0A2463] whitespace-pre-wrap">
                  {reply.content}
                </div>

                {/* Reply Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(undefined, reply.id)}
                    className="text-[#0A2463]/70 hover:text-[#FFA500]"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {reply.like_count}
                  </Button>
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(reply.id)}
                      className="text-[#0A2463]/70 hover:text-[#3B82F6]"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>

                {/* Quick Reply Form */}
                {replyingTo === reply.id && (
                  <div className="mt-4 p-4 bg-[#FEF3C7] rounded-lg">
                    <p className="text-sm text-[#0A2463]/70 mb-2">
                      Replying to <span className="font-semibold">{reply.author?.name}</span>
                    </p>
                    <form onSubmit={handleSubmitReply} className="space-y-3">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={submitting || !replyContent.trim()}
                          className="bg-[#FFA500] hover:bg-[#F7931E]"
                        >
                          {submitting ? 'Posting...' : 'Post Reply'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nested Replies */}
        {reply.replies && reply.replies.length > 0 && (
          <div className="mt-4">
            {reply.replies.map((nestedReply) => renderReply(nestedReply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFA500]"></div>
          <p className="mt-4 text-[#0A2463]/70">Loading topic...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0A2463] mb-4">Topic not found</h2>
          <Link to="/forum">
            <Button className="bg-[#FFA500] hover:bg-[#F7931E]">
              Back to Forum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-[#0A2463]/70">
            <Link to="/" className="hover:text-[#FFA500] transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/forum" className="hover:text-[#FFA500] transition-colors">
              Forum
            </Link>
            <ChevronRight className="h-4 w-4" />
            {topic.category && (
              <>
                <Link 
                  to={`/forum?category=${topic.category.id}`}
                  className="hover:text-[#FFA500] transition-colors"
                >
                  {topic.category.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-[#0A2463] font-medium truncate">{topic.title}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Topic Header */}
        <Card className="border-2 border-[#FFA500]/20 shadow-xl mb-6">
          <CardContent className="p-8">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {topic.is_pinned && (
                <Badge className="bg-[#8B5CF6]">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {topic.is_featured && (
                <Badge className="bg-[#10B981]">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {topic.is_locked && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
              {topic.status === 'solved' && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              )}
              {topic.category && (
                <Badge 
                  variant="outline" 
                  style={{ borderColor: topic.category.color, color: topic.category.color }}
                >
                  {topic.category.name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-[#0A2463] mb-6">
              {topic.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFA500] to-[#F7931E] flex items-center justify-center text-white font-bold text-lg">
                  {topic.author?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-bold text-[#0A2463]">{topic.author?.name || 'Anonymous'}</div>
                  <div className="text-sm text-[#0A2463]/70">
                    Posted {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Topic Actions */}
              {user && (isAuthor(topic.author_id) || isModerator()) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreVertical className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditTopic}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Topic
                    </DropdownMenuItem>
                    {isModerator() && (
                      <>
                        <DropdownMenuItem>
                          <Pin className="h-4 w-4 mr-2" />
                          {topic.is_pinned ? 'Unpin' : 'Pin'} Topic
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Lock className="h-4 w-4 mr-2" />
                          {topic.is_locked ? 'Unlock' : 'Lock'} Topic
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Solved
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem className="text-red-600" onClick={handleDeleteTopic}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Topic
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none text-[#0A2463] mb-6 whitespace-pre-wrap">
              {topic.content}
            </div>

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {topic.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-[#FEF3C7]"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(topic.id)}
                className="text-[#0A2463]/70 hover:text-[#FFA500]"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {topic.like_count} Likes
              </Button>
              <div className="flex items-center gap-2 text-[#0A2463]/70">
                <MessageSquare className="h-4 w-4" />
                <span>{topic.reply_count} Replies</span>
              </div>
              <div className="flex items-center gap-2 text-[#0A2463]/70">
                <Eye className="h-4 w-4" />
                <span>{topic.view_count} Views</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0A2463] mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#FFA500]" />
            {topic.reply_count} {topic.reply_count === 1 ? 'Reply' : 'Replies'}
          </h2>

          {replies.length === 0 ? (
            <Card className="border-2 border-[#FFA500]/20 shadow-lg">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 text-[#0A2463]/20 mx-auto mb-4" />
                <p className="text-[#0A2463]/70">No replies yet. Be the first to respond!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => renderReply(reply, 0))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {user ? (
          !topic.is_locked ? (
            <Card className="border-2 border-[#FFA500]/20 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-[#0A2463] mb-4">Post a Reply</h3>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    rows={6}
                    className="resize-none"
                  />
                  <Button 
                    type="submit" 
                    disabled={submitting || !replyContent.trim()}
                    className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-gray-300 shadow-lg">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">This topic is locked. No new replies can be posted.</p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="border-2 border-[#FFA500]/20 shadow-xl">
            <CardContent className="p-8 text-center">
              <p className="text-[#0A2463]/70 mb-4">Sign in to join the discussion</p>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E]">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Topic Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter topic title"
                maxLength={300}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter topic content"
                rows={10}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editing || !editTitle.trim() || !editContent.trim()}
                className="bg-[#FFA500] hover:bg-[#F7931E]"
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this topic? This action cannot be undone.
              All replies will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForumTopic;

