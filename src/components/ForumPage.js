import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ArrowUp, ArrowDown, MessageSquare, Trash } from 'lucide-react';

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [title, setTitle] = useState('');
  const [selectedSubforum, setSelectedSubforum] = useState('general');
  const [sortBy, setSortBy] = useState('new');
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');

  const subforums = ['general', 'tech', 'gaming', 'sports', 'news'];

  const fetchPosts = useCallback(async () => {
    const q = query(
      collection(db, 'posts'), 
      orderBy(sortBy === 'new' ? 'timestamp' : 'votes', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const postsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(post => post.subforum === selectedSubforum);
    setPosts(postsData);

    const commentsData = {};
    for (const post of postsData) {
      const commentsSnapshot = await getDocs(collection(db, `posts/${post.id}/comments`));
      commentsData[post.id] = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    setComments(commentsData);
  }, [selectedSubforum, sortBy]);

  useEffect(() => {
    const getFeed = async () => {
      await fetchPosts();
    };
    getFeed();
  }, [selectedSubforum, sortBy, fetchPosts]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !newPost.trim()) return;

    await addDoc(collection(db, 'posts'), {
      title,
      content: newPost,
      author: auth.currentUser.email,
      authorId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      votes: 0,
      subforum: selectedSubforum,
      commentCount: 0
    });

    setTitle('');
    setNewPost('');
    fetchPosts();
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;

    await addDoc(collection(db, `posts/${postId}/comments`), {
      content: newComment,
      author: auth.currentUser.email,
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
  };

  const handleVote = async (postId, increment) => {
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    await updateDoc(postRef, {
      votes: (post.votes || 0) + increment
    });
    fetchPosts();
  };

  const deletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, 'posts', postId));
      fetchPosts();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Reddit-like Forum</h1>
            <div className="flex gap-4">
              <select 
                value={selectedSubforum}
                onChange={(e) => setSelectedSubforum(e.target.value)}
                className="border rounded p-1"
              >
                {subforums.map(forum => (
                  <option key={forum} value={forum}>{forum}</option>
                ))}
              </select>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded p-1"
              >
                <option value="new">New</option>
                <option value="votes">Top</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => handleVote(post.id, 1)}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <ArrowUp size={20} />
                  </button>
                  <span className="text-sm font-bold">{post.votes || 0}</span>
                  <button 
                    onClick={() => handleVote(post.id, -1)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <ArrowDown size={20} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{post.title}</h3>
                  <p className="text-gray-600 mt-2">{post.content}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{post.timestamp?.toDate().toLocaleDateString()}</span>
                    {post.authorId === auth.currentUser?.uid && (
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} />
                      <span className="text-sm text-gray-500">
                        {comments[post.id]?.length || 0} comments
                      </span>
                    </div>
                    <div className="space-y-2">
                      {comments[post.id]?.map(comment => (
                        <div key={comment.id} className="bg-gray-50 p-2 rounded">
                          <p className="text-sm">{comment.content}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.author} • {comment.timestamp?.toDate().toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 p-2 border rounded text-sm"
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-20">
            <h2 className="text-lg font-bold mb-4">Create Post</h2>
            <form onSubmit={createPost} className="space-y-4">
              <input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full p-2 border rounded h-24"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForumPage;