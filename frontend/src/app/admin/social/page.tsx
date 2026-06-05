'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiImage, FiVideo, FiMic, FiSend, FiMoreHorizontal, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import { io } from 'socket.io-client';

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
}

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp-like attachments state
  const [selectedMediaType, setSelectedMediaType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO' | 'NONE'>('NONE');
  const [acceptType, setAcceptType] = useState('image/*');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'AUDIO' | 'NONE'>('NONE');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    
    const socket = io(((process.env as any).NEXT_PUBLIC_API_URL as string) || '');
    socket.on('newSocialPost', (post: Post) => {
      setPosts((prev: Post[]) => {
        if (!Array.isArray(prev)) return [post];
        return [post, ...prev];
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
        setPosts(data);
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">×</button>
        </div>
      )}

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

      <div className="space-y-6">
        {loading ? (
          [1,2,3].map((i: number) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>)
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">No field updates available.</div>
        ) : (
          posts.map((post: Post) => (
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
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><FiMoreHorizontal className="w-5 h-5" /></button>
                </div>

                <p className="text-slate-600 leading-relaxed font-medium mb-6">
                  {post.content}
                </p>

                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                    {post.mediaType === 'IMAGE' && <img src={post.mediaUrl} alt="Update" className="w-full h-auto object-cover max-h-[500px]" />}
                    {post.mediaType === 'VIDEO' && <video src={post.mediaUrl} controls className="w-full" />}
                    {post.mediaType === 'AUDIO' && <audio src={post.mediaUrl} controls className="w-full p-4" />}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                      <FiHeart className="w-5 h-5" /> <span className="text-xs font-bold">24</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                      <FiMessageCircle className="w-5 h-5" /> <span className="text-xs font-bold">12</span>
                    </button>
                  </div>
                  <button className="text-slate-400 hover:text-blue-600 transition-colors">
                    <FiShare2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
