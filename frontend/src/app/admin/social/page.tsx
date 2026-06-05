'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiImage, FiVideo, FiMic, FiSend, FiMoreHorizontal, FiHeart, FiMessageCircle, FiShare2, FiX, FiChevronUp, FiChevronDown, FiPlay, FiGrid, FiTv, FiTrash2 } from 'react-icons/fi';
import { io } from 'socket.io-client';

interface Like {
  id: string;
  postId: string;
  employeeId: string;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  employeeId: string;
  content: string;
  createdAt: string;
  employee: {
    firstName: string;
    lastName: string;
    designation: string;
  };
}

interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'NONE';
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
  };
  likes: Like[];
  comments: Comment[];
}

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs navigation: feed vs reels
  const [activeTab, setActiveTab] = useState<'feed' | 'reels'>('feed');

  // Reels fullscreen modal player state
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [reelCommentsOpen, setReelCommentsOpen] = useState(false);

  // Reels sort order state
  const [reelsSortOrder, setReelsSortOrder] = useState<'recent' | 'liked'>('recent');

  // User session details
  const [myEmployeeId, setMyEmployeeId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // WhatsApp-like attachments state
  const [selectedMediaType, setSelectedMediaType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO' | 'NONE'>('NONE');
  const [acceptType, setAcceptType] = useState('image/*');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO' | 'NONE'>('NONE');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instagram-style comment interface state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setMyEmployeeId(localStorage.getItem('employeeId') || '');
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      setIsAdmin(userObj.role === 'SUPER_ADMIN' || userObj.role === 'ADMIN');
    } catch (e) {
      console.error('Error parsing user session', e);
    }
    fetchPosts();
    
    const socket = io(((process.env as any).NEXT_PUBLIC_API_URL as string) || '');
    
    socket.on('newSocialPost', (post: Post) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return [post];
        const safePost = {
          ...post,
          likes: post.likes || [],
          comments: post.comments || []
        };
        return [safePost, ...prev];
      });
    });

    socket.on('socialPostLiked', (data: { postId: string; employeeId: string; action: 'LIKE' | 'UNLIKE'; like?: Like }) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((p: Post) => {
          if (p.id !== data.postId) return p;
          let newLikes = [...(p.likes || [])];
          if (data.action === 'LIKE' && data.like) {
            if (!newLikes.some((l: Like) => l.employeeId === data.employeeId)) {
              newLikes.push(data.like);
            }
          } else if (data.action === 'UNLIKE') {
            newLikes = newLikes.filter((l: Like) => l.employeeId !== data.employeeId);
          }
          return { ...p, likes: newLikes };
        });
      });
    });

    socket.on('socialPostCommented', (data: { postId: string; comment: Comment }) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((p: Post) => {
          if (p.id !== data.postId) return p;
          const newComments = [...(p.comments || [])];
          if (!newComments.some((c: Comment) => c.id === data.comment.id)) {
            newComments.push(data.comment);
          }
          return { ...p, comments: newComments };
        });
      });
    });

    socket.on('socialPostDeleted', (data: { postId: string }) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((p: Post) => p.id !== data.postId);
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const triggerMediaUpload = (type: 'IMAGE' | 'VIDEO' | 'AUDIO') => {
    setSelectedMediaType(type);
    if (type === 'IMAGE') setAcceptType('image/*');
    else if (type === 'VIDEO') setAcceptType('video/*');
    else if (type === 'AUDIO') setAcceptType('audio/*');
    
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file); // API routes/upload expects 'image'

    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload media');
      }

      setMediaUrl(data.url);
      setMediaType(selectedMediaType);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error uploading media file');
      setMediaUrl('');
      setMediaType('NONE');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchPosts = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/social`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }
      
      if (Array.isArray(data)) {
        const safeData = data.map(p => ({
          ...p,
          likes: p.likes || [],
          comments: p.comments || []
        }));
        setPosts(safeData);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !mediaUrl) return;
    setPosting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/social`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: newPost, 
          mediaUrl: mediaUrl || undefined, 
          mediaType: mediaType || 'NONE' 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
      setNewPost('');
      setMediaUrl('');
      setMediaType('NONE');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error creating post');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/social/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to toggle like');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error toggling like');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev: Record<string, boolean>) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev: Record<string, string>) => ({
      ...prev,
      [postId]: text
    }));
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/social/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to post comment');
      }

      setCommentInputs((prev: Record<string, string>) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error posting comment');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = ((process.env as any).NEXT_PUBLIC_API_URL as string) || '';
      const res = await fetch(`${apiUrl}/api/social/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete post');
      }
      // Instantly remove post from local state
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((p: Post) => p.id !== postId);
      });
      setActiveReelIndex(null);
      setReelCommentsOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error deleting post');
    }
  };

  const reels = posts
    .filter((p: Post) => p.mediaType === 'VIDEO' && p.mediaUrl)
    .sort((a, b) => {
      if (reelsSortOrder === 'liked') {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">×</button>
        </div>
      )}

      {/* Tabs navigation: Feed vs Reels */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-xs mx-auto border border-slate-200">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'feed'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiTv className="w-4 h-4" /> Feed
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'reels'
              ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiGrid className="w-4 h-4" /> Reels ({reels.length})
        </button>
      </div>

      {activeTab === 'reels' && (
        <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm shadow-blue-500/5 max-w-sm mx-auto animate-[fadeIn_0.2s_ease-out]">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sort Reels:</span>
          <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => setReelsSortOrder('recent')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                reelsSortOrder === 'recent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setReelsSortOrder('liked')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                reelsSortOrder === 'liked'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Most Liked
            </button>
          </div>
        </div>
      )}

      {activeTab === 'feed' ? (
        <>
          {/* Social Post Creation Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 p-6 border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200 italic">U</div>
              <textarea 
                placeholder="Share an installation update or field note..."
                className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none min-h-[100px]"
                value={newPost}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPost(e.target.value)}
              ></textarea>
            </div>

            {/* WhatsApp-style Media Upload Preview */}
            {uploadingMedia && (
              <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500 animate-pulse flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                Uploading attachment to server...
              </div>
            )}
            {!uploadingMedia && mediaUrl && (
              <div className="mb-4 relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 max-h-[200px] flex items-center justify-center group/preview">
                {mediaType === 'IMAGE' && <img src={mediaUrl} alt="Preview" className="max-h-[200px] object-contain w-full" />}
                {mediaType === 'VIDEO' && <video src={mediaUrl} controls className="max-h-[200px] w-full" />}
                {mediaType === 'AUDIO' && <audio src={mediaUrl} controls className="w-full p-4" />}
                <button 
                  type="button" 
                  onClick={() => { setMediaUrl(''); setMediaType('NONE'); }}
                  className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900/80 text-white px-3 py-1.5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider shadow-md"
                  title="Remove attachment"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <div className="flex gap-2">
                <button 
                  onClick={() => triggerMediaUpload('IMAGE')}
                  disabled={uploadingMedia || posting}
                  className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <FiImage className="w-4 h-4" /> Photo
                </button>
                <button 
                  onClick={() => triggerMediaUpload('VIDEO')}
                  disabled={uploadingMedia || posting}
                  className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <FiVideo className="w-4 h-4" /> Video
                </button>
                <button 
                  onClick={() => triggerMediaUpload('AUDIO')}
                  disabled={uploadingMedia || posting}
                  className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <FiMic className="w-4 h-4" /> Audio
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                accept={acceptType} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />

              <button 
                onClick={handlePost}
                disabled={posting || uploadingMedia || (!newPost.trim() && !mediaUrl)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {posting ? 'Posting...' : <><FiSend /> Post Update</>}
              </button>
            </div>
          </div>

          {/* Social Post Feed */}
          <div className="space-y-6">
            {loading ? (
              [1,2,3].map((i: number) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>)
            ) : !posts || posts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-md">
                  <FiTv className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-1">Feed is Quiet</h4>
                <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">Be the first to share an installation update, video update, or voice note with the company!</p>
              </div>
            ) : (
              posts.map((post: Post) => {
                const isLikedByMe = post.likes && post.likes.some(l => l.employeeId === myEmployeeId);
                return (
                  <div key={post.id} className="bg-white rounded-3xl shadow-md shadow-slate-100/35 border border-slate-100/80 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/8 transition-all duration-300 animate-[fadeIn_0.3s_ease-out]">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl border border-slate-200 uppercase">
                            {(post.author?.firstName?.[0] || 'U')}{(post.author?.lastName?.[0] || 'U')}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg leading-tight">{post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">{post.author?.designation || 'Engineer'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                    <div className="flex gap-1">
                      {(post.authorId === myEmployeeId || isAdmin) && (
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Post"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <FiMoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                      </div>

                      <p className="text-slate-600 leading-relaxed font-medium mb-6 whitespace-pre-line">
                        {post.content}
                      </p>

                      {post.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                          {post.mediaType === 'IMAGE' && <img src={post.mediaUrl} alt="Update" className="w-full h-auto object-cover max-h-[500px]" />}
                          {post.mediaType === 'VIDEO' && <video src={post.mediaUrl} controls className="w-full" />}
                          {post.mediaType === 'AUDIO' && <audio src={post.mediaUrl} controls className="w-full p-4" />}
                        </div>
                      )}

                      {/* Actions & Statistics Bar */}
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex gap-4">
                          {/* Like Action */}
                          <button 
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 transition-colors font-bold text-xs ${
                              isLikedByMe ? 'text-rose-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <FiHeart className={`w-5 h-5 ${isLikedByMe ? 'fill-rose-500' : ''}`} />
                            <span>{post.likes ? post.likes.length : 0}</span>
                          </button>

                          {/* Toggle Comments Panel Action */}
                          <button 
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors font-bold text-xs"
                          >
                            <FiMessageCircle className="w-5 h-5" /> 
                            <span>{post.comments ? post.comments.length : 0}</span>
                          </button>
                        </div>

                        <button className="text-slate-400 hover:text-blue-600 transition-colors">
                          <FiShare2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Expanding Comments Drawer (Instagram style) */}
                      {expandedComments[post.id] && (
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                            {!post.comments || post.comments.length === 0 ? (
                              <p className="text-xs text-slate-400 font-bold italic text-center py-2">No comments yet. Share your thoughts!</p>
                            ) : (
                              post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 items-start text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase shrink-0">
                                    {(comment.employee?.firstName?.[0] || 'U')}{(comment.employee?.lastName?.[0] || 'U')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-slate-800 text-xs truncate">{comment.employee?.firstName} {comment.employee?.lastName}</span>
                                      <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md uppercase font-black">{comment.employee?.designation || 'Specialist'}</span>
                                      <span className="text-[8px] text-slate-400 font-semibold uppercase ml-auto">{new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <p className="text-slate-600 mt-1 text-xs font-semibold leading-relaxed whitespace-pre-line">{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          {/* Add Comment Input Form */}
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCommentChange(post.id, e.target.value)}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id);
                                }
                              }}
                              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button 
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-xs font-bold shrink-0"
                            >
                              <FiSend className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Reels Layout (Instagram Video grid view) */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-[fadeIn_0.3s_ease-out]">
          {reels.length === 0 ? (
            <div className="col-span-full text-center py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl animate-[fadeIn_0.3s_ease-out]">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-md">
                <FiVideo className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-1">No Video Updates</h4>
              <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">Upload a video attachment in the feed tab to share your field updates and see them here as Reels!</p>
            </div>
          ) : (
            reels.map((post, idx) => (
              <div 
                key={post.id} 
                onClick={() => setActiveReelIndex(idx)}
                className="aspect-[9/16] relative bg-slate-900 rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <video src={post.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop playsInline />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-black text-[9px] uppercase backdrop-blur-md">
                      {(post.author?.firstName?.[0] || 'U')}{(post.author?.lastName?.[0] || 'U')}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate">{post.author?.firstName} {post.author?.lastName}</span>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight font-semibold">{post.content}</p>
                  <div className="flex gap-3 mt-3 text-white text-[10px] font-black">
                    <span className="flex items-center gap-1"><FiHeart className="w-3.5 h-3.5 fill-white text-rose-500" /> {post.likes?.length || 0}</span>
                    <span className="flex items-center gap-1"><FiMessageCircle className="w-3.5 h-3.5" /> {post.comments?.length || 0}</span>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <FiPlay className="w-5 h-5 fill-white" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Instagram Reels Modal Viewer Overlay */}
      {activeReelIndex !== null && reels[activeReelIndex] && (() => {
        const post = reels[activeReelIndex];
        const isLikedByMe = post.likes && post.likes.some(l => l.employeeId === myEmployeeId);
        
        return (
          <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
            
            <div className="relative w-full max-w-[450px] h-full sm:h-[90vh] bg-black sm:rounded-[2.5rem] overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5">
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center text-white">
              <span className="text-xs font-black tracking-widest uppercase bg-black/45 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">🎥 Reel {activeReelIndex + 1} of {reels.length}</span>
              <div className="flex gap-2">
                {(post.authorId === myEmployeeId || isAdmin) && (
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="bg-rose-600/80 backdrop-blur-md hover:bg-rose-600 border border-rose-500/30 text-white p-2.5 rounded-2xl transition-all shadow-lg"
                    title="Delete Reel"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => { setActiveReelIndex(null); setReelCommentsOpen(false); }}
                  className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white p-2.5 rounded-2xl transition-all"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

              {/* Main Reel Player */}
              <div className="flex-1 w-full h-full flex items-center justify-center relative select-none">
                <video 
                  src={post.mediaUrl} 
                  autoPlay 
                  loop 
                  playsInline
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) video.play();
                    else video.pause();
                  }}
                  className="w-full h-full object-contain bg-black cursor-pointer"
                />

                {/* Right Actions Panel Overlay */}
                <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6 items-center">
                  {/* Like Button */}
                  <button 
                    onClick={() => handleToggleLike(post.id)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className={`p-3.5 rounded-full border backdrop-blur-md transition-all ${
                      isLikedByMe 
                        ? 'bg-rose-600/90 border-rose-500 text-white scale-110 shadow-lg shadow-rose-500/20' 
                        : 'bg-black/40 border-white/10 text-white hover:bg-white/10'
                    }`}>
                      <FiHeart className={`w-6 h-6 ${isLikedByMe ? 'fill-white' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black text-white drop-shadow-md">{post.likes?.length || 0}</span>
                  </button>

                  {/* Comments Toggle */}
                  <button 
                    onClick={() => setReelCommentsOpen(!reelCommentsOpen)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className={`p-3.5 rounded-full border backdrop-blur-md transition-all ${
                      reelCommentsOpen 
                        ? 'bg-blue-600/90 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-black/40 border-white/10 text-white hover:bg-white/10'
                    }`}>
                      <FiMessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-white drop-shadow-md">{post.comments?.length || 0}</span>
                  </button>

                  {/* Navigation Arrows */}
                  <div className="flex flex-col gap-2 mt-4">
                    <button 
                      disabled={activeReelIndex === 0}
                      onClick={() => { setActiveReelIndex(activeReelIndex - 1); setReelCommentsOpen(false); }}
                      className="p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <FiChevronUp className="w-5 h-5" />
                    </button>
                    <button 
                      disabled={activeReelIndex === reels.length - 1}
                      onClick={() => { setActiveReelIndex(activeReelIndex + 1); setReelCommentsOpen(false); }}
                      className="p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <FiChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Left Info Panel */}
                <div className="absolute left-4 bottom-4 right-20 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 rounded-2xl border border-white/5 backdrop-blur-[2px]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                      {(post.author?.firstName?.[0] || 'U')}{(post.author?.lastName?.[0] || 'U')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-tight">{post.author?.firstName} {post.author?.lastName}</h4>
                      <span className="text-[9px] font-black bg-blue-500/20 border border-blue-500/30 text-blue-200 px-2 py-0.5 rounded-md uppercase tracking-wide">{post.author?.designation || 'Engineer'}</span>
                    </div>
                  </div>
                  <p className="text-slate-200 text-xs font-semibold leading-relaxed line-clamp-3 whitespace-pre-line">{post.content}</p>
                </div>
              </div>

              {/* Collapsible Comments Overlay drawer inside modal */}
              {reelCommentsOpen && (
                <div className="absolute inset-x-0 bottom-0 top-[40%] sm:top-auto sm:bottom-0 sm:h-[420px] bg-slate-900 border-t border-white/10 z-30 rounded-t-[2rem] p-5 flex flex-col justify-between animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)_both]">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider">💬 Comments ({post.comments?.length || 0})</span>
                    <button onClick={() => setReelCommentsOpen(false)} className="text-slate-400 hover:text-white"><FiX className="w-5 h-5" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0 mb-4 scrollbar-thin">
                    {!post.comments || post.comments.length === 0 ? (
                      <p className="text-xs text-slate-500 font-bold italic text-center py-6">No comments yet. Share your thoughts!</p>
                    ) : (
                      post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2.5 items-start text-xs bg-white/5 border border-white/5 p-3 rounded-xl">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[10px] uppercase shrink-0">
                            {(comment.employee?.firstName?.[0] || 'U')}{(comment.employee?.lastName?.[0] || 'U')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-white text-[11px] truncate">{comment.employee?.firstName} {comment.employee?.lastName}</span>
                              <span className="text-[7px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-black">{comment.employee?.designation || 'Specialist'}</span>
                            </div>
                            <p className="text-slate-300 mt-1 text-[11px] font-medium leading-relaxed whitespace-pre-line">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Entry box */}
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCommentChange(post.id, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <button 
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-xs shrink-0"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
