import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';

const Comment = ({ comment, onReply, onVote, currentUser }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="group">
      <div className="flex gap-2">
        {/* Vote buttons */}
        <div className="flex flex-col items-center">
          <button 
            className={`vote-button ${comment.userVotes?.[currentUser?.uid] === 'up' ? 'active-upvote' : ''}`}
            onClick={() => onVote(comment.id, 'up')}
            disabled={!currentUser}
          >
            <ArrowBigUp className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold">{comment.votes}</span>
          <button 
            className={`vote-button ${comment.userVotes?.[currentUser?.uid] === 'down' ? 'active-downvote' : ''}`}
            onClick={() => onVote(comment.id, 'down')}
            disabled={!currentUser}
          >
            <ArrowBigDown className="w-4 h-4" />
          </button>
        </div>

        {/* Comment content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-gray-900">u/{comment.author}</span>
            <span>{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm my-1">{comment.content}</p>
          
          {/* Comment actions */}
          {currentUser && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs hover:bg-gray-100"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <form onSubmit={handleSubmitReply} className="mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full p-2 text-sm border rounded-md min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  type="button" 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyInput(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  size="sm"
                  className="bg-[#FF4500] hover:bg-[#FF4500]/90"
                >
                  Reply
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;