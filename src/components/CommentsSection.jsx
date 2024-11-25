import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CommentsSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!postId) return;

    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const fetchedComments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? 
                data.createdAt.toDate().toISOString() : 
                new Date().toISOString()
            };
          });
          setComments(fetchedComments);
          setLoading(false);
          setIndexBuilding(false);
        },
        (error) => {
          console.error('Error fetching comments:', error);
          if (error.message.includes('index')) {
            setIndexBuilding(true);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up comments listener:', error);
      setLoading(false);
    }
  }, [postId]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        content: newComment.trim(),
        author: currentUser.displayName,
        authorId: currentUser.uid,
        votes: 1,
        userVotes: { [currentUser.uid]: 'up' },
        createdAt: serverTimestamp()
      });
      
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Error posting comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (indexBuilding) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-2">Setting up comments...</p>
        <p className="text-sm text-gray-500">This may take a few minutes. Please refresh the page shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full p-3 text-sm border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end mt-2">
            <Button 
              type="submit"
              className="bg-[#FF4500] hover:bg-[#FF4500]/90"
            >
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-md mb-6">
          <p className="text-gray-600">Log in to leave a comment</p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="group">
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <button className="vote-button">
                  <ArrowBigUp className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold">{comment.votes}</span>
                <button className="vote-button">
                  <ArrowBigDown className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-900">u/{comment.author}</span>
                  <span>{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <div className="mt-1">
                  <p className="text-sm text-gray-900">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;