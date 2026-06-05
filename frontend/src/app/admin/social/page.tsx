'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiImage, FiVideo, FiMic, FiSend, FiMoreHorizontal, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
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

  // User session details
  const [myEmployeeId, setMyEmployeeId] = useState<string>('');

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
    fetchPosts();
    
    const socket = io(((process.env as any).NEXT_PUBLIC_API_URL as string) || '');
    
    socket.on('newSocialPost', (post: Post) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return [post];
        // Ensure likes/comments default to arrays if not provided
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
        return prev.map(p => {
          if (p.id !== data.postId) return p;
          let newLikes = [...(p.likes || [])];
          if (data.action === 'LIKE' && data.like) {
            if (!newLikes.some(l => l.employeeId === data.employeeId)) {
              newLikes.push(data.like);
            }
          } else if (data.action === 'UNLIKE') {
            newLikes = newLikes.filter(l => l.employeeId !== data.employeeId);
          }
          return { ...p, likes: newLikes };
        });
      });
    });

    socket.on('socialPostCommented', (data: { postId: string; comment: Comment }) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(p => {
          if (p.id !== data.postId) return p;
          const newComments = [...(p.comments || [])];
          if (!newComments.some(c => c.id === data.comment.id)) {
            newComments.push(data.comment);
          }
          return { ...p, comments: newComments };
        });
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }
      
      if (Array.isArray(data)) {
        // Safe mapping to ensure arrays exist
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
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs(prev => ({
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

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error posting comment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">×</button>
        </div>
      )}

      {/* Social Post Creation Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 p-6 border border-slate-100">
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
          <div className="text-center py-12 text-slate-400 font-bold">No field updates available.</div>
        ) : (
          posts.map((post: Post) => {
            const isLikedByMe = post.likes && post.likes.some(l => l.employeeId === myEmployeeId);
            return (
              <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
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
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><FiMoreHorizontal className="w-5 h-5" /></button>
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
                                <div className="flex items-center gap-2 flex-wrap">
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
    </div>
  );
}
