import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { MessageSquare, ThumbsUp, MessageCircle, PlusCircle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

const ForumPage = ({ user, onLogout }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newComment, setNewComment] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/forum/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/forum/posts`, newPost);
      toast.success('Post created successfully');
      setNewPost({ title: '', content: '' });
      setDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const upvotePost = async (postId) => {
    try {
      await axios.post(`${API}/forum/posts/${postId}/upvote`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  const addComment = async (postId) => {
    const content = newComment[postId];
    if (!content?.trim()) return;

    try {
      await axios.post(`${API}/forum/posts/${postId}/comments`, null, {
        params: { content }
      });
      setNewComment({ ...newComment, [postId]: '' });
      toast.success('Comment added');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="forum-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 flex-1">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Community Forum
                </h1>
                <p className="text-gray-600">Share experiences and support each other</p>
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="ml-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                data-testid="create-post-button"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Share your thoughts with the community</DialogDescription>
              </DialogHeader>
              <form onSubmit={createPost} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input
                    id="post-title"
                    placeholder="Enter post title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                    data-testid="post-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-content">Content</Label>
                  <Textarea
                    id="post-content"
                    placeholder="Share your thoughts..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                    required
                    data-testid="post-content-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                  data-testid="submit-post-button"
                >
                  {loading ? 'Posting...' : 'Post'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No posts yet. Be the first to share!</p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="card-hover" data-testid="forum-post">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {post.author_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{post.title}</CardTitle>
                      <CardDescription>
                        by {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => upvotePost(post.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-pink-600"
                      data-testid="upvote-button"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.upvotes || 0}</span>
                    </Button>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                      {post.comments.map((comment, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg" data-testid="comment-item">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{comment.author_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                      data-testid="comment-input"
                    />
                    <Button
                      onClick={() => addComment(post.id)}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      data-testid="add-comment-button"
                    >
                      Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ForumPage;