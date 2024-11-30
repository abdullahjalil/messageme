import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { ArrowUp, ArrowDown, MessageSquare, Trash, LogOut, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateActivity } from '../utils/sessionHelper';

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [title, setTitle] = useState('');
  const [selectedSubforum, setSelectedSubforum] = useState('general');
  const [sortBy, setSortBy] = useState('new');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const subforums = ['general', 'tech', 'gaming', 'sports', 'news'];




  // Activity tracking
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, 'posts'),
        orderBy(sortBy === 'new' ? 'timestamp' : 'votes', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(post => post.subforum === selectedSubforum);

      const commentsData = {};
      for (const post of postsData) {
        const commentsSnapshot = await getDocs(collection(db, `posts/${post.id}/comments`));
        commentsData[post.id] = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      setPosts(postsData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubforum, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileRef = ref(storage, `post-images/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };


  const createPost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !newPost.trim()) return;

    try {
      setIsUploading(true);
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await addDoc(collection(db, 'posts'), {
        title,
        content: newPost,
        author: auth.currentUser.displayName || 'Anonymous User',
        authorEmail: auth.currentUser.email,
        authorId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        votes: 0,
        subforum: selectedSubforum,
        commentCount: 0,
        imageUrl
      });

      setTitle('');
      setNewPost('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        content: newComment,
        author: auth.currentUser.displayName || 'Anonymous User',
        authorEmail: auth.currentUser.email,
        authorId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        votes: 0
      });

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentCount: (comments[postId]?.length || 0) + 1
      });

      setNewComment('');
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleVote = async (postId, increment) => {
    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      await updateDoc(postRef, {
        votes: (post.votes || 0) + increment
      });
      fetchPosts();
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBE9D0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E64833] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBE9D0]">
      <div className="bg-[#244855] shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#FBE9D0]">PROMETHEUS FORUM</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <select
                value={selectedSubforum}
                onChange={(e) => setSelectedSubforum(e.target.value)}
                className="flex-1 sm:flex-none bg-[#90AEAD] text-[#244855] border-none rounded px-2 py-1.5 text-sm"
              >
                {subforums.map(forum => (
                  <option key={forum} value={forum}>{forum.toUpperCase()}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none bg-[#90AEAD] text-[#244855] border-none rounded px-2 py-1.5 text-sm"
              >
                <option value="new">NEW</option>
                <option value="votes">TOP</option>
              </select>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1 bg-[#E64833] text-[#FBE9D0] px-3 py-1.5 rounded hover:bg-[#874F41] transition-colors text-sm w-full sm:w-auto"
              >
                <LogOut size={16} />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 lg:order-2">
          <div className="bg-[#90AEAD] rounded-lg shadow-lg p-4 sticky top-20">
            <h2 className="text-lg font-bold text-[#244855] mb-4">CREATE POST</h2>
            <form onSubmit={createPost} className="space-y-4">
              <input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 rounded text-[#244855] bg-[#FBE9D0] text-sm"
              />
              <textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full p-2 rounded h-24 text-[#244855] bg-[#FBE9D0] text-sm"
              />
              {/* Image upload section */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="bg-[#244855] text-[#FBE9D0] p-2 rounded hover:bg-[#874F41] transition-colors">
                    <Image size={20} />
                  </div>
                  <span className="text-sm text-[#244855]">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-[#E64833] text-[#FBE9D0] p-1 rounded-full hover:bg-[#874F41]"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full bg-[#E64833] text-[#FBE9D0] p-2 rounded hover:bg-[#874F41] uppercase font-bold text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isUploading ? 'Uploading...' : 'Post'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 lg:order-1 space-y-4">
          {posts.length === 0 ? (
            <div className="bg-[#90AEAD] rounded-lg shadow-lg p-4 text-center">
              <p className="text-[#244855]">No posts in this subforum yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-[#90AEAD] rounded-lg shadow-lg p-4">
                <div className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleVote(post.id, 1)}
                      className="text-[#244855] hover:text-[#E64833] p-1"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <span className="text-sm font-bold text-[#244855]">{post.votes || 0}</span>
                    <button
                      onClick={() => handleVote(post.id, -1)}
                      className="text-[#244855] hover:text-[#E64833] p-1"
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-[#244855] break-words">
                      {post.title}
                    </h3>
                    <p className="text-[#244855] mt-2 text-sm sm:text-base break-words">
                      {post.content}
                    </p>
                    {post.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={post.imageUrl}
                          alt="Post content"
                          className="w-full max-h-96 object-cover rounded"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center text-xs sm:text-sm text-[#244855] mt-2 gap-2">
                      <span className="font-medium">{post.author}</span>
                      <span>•</span>
                      <span>{post.timestamp?.toDate().toLocaleDateString()}</span>
                      {post.authorId === auth.currentUser?.uid && (
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-[#E64833] hover:text-[#874F41]"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-[#244855]" />
                        <span className="text-xs sm:text-sm text-[#244855]">
                          {comments[post.id]?.length || 0} comments
                        </span>
                      </div>
                      <div className="space-y-2">
                        {comments[post.id]?.map(comment => (
                          <div key={comment.id} className="bg-[#FBE9D0] p-2 rounded">
                            <p className="text-sm text-[#244855] break-words">
                              {comment.content}
                            </p>
                            <div className="text-xs text-[#874F41] mt-1">
                              <span className="font-medium">{comment.author}</span>
                              <span className="mx-1">•</span>
                              <span>
                                {comment.timestamp?.toDate().toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 p-2 rounded text-sm bg-[#FBE9D0] text-[#244855]"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="bg-[#E64833] text-[#FBE9D0] px-3 py-1.5 rounded hover:bg-[#874F41] text-sm whitespace-nowrap"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ForumPage;