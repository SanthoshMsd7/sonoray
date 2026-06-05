'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchPosts();
    
    const socket = io(process.env.NEXT_PUBLIC_API_URL || '');
    socket.on('newSocialPost', (post: Post) => {
      setPosts(prev => {
        if (!Array.isArray(prev)) return [post];
        return [post, ...prev];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchPosts = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/social`, {
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
    if (!newPost.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/social`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newPost, mediaType: 'NONE' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
      setNewPost('');
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
            onChange={(e) => setNewPost(e.target.value)}
          ></textarea>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
          <div className="flex gap-2">
            <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <FiImage className="w-4 h-4" /> Photo
            </button>
            <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <FiVideo className="w-4 h-4" /> Video
            </button>
            <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <FiMic className="w-4 h-4" /> Audio
            </button>
          </div>
          <button 
            onClick={handlePost}
            disabled={posting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 text-sm"
          >
            {posting ? 'Posting...' : <><FiSend /> Post Update</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl"></div>)
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold">No field updates available.</div>
        ) : (
          posts.map((post) => (
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
