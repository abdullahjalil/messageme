import React, { useState } from 'react';
import { Card } from './ui/card';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, BookmarkPlus, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import CommentsSection from './CommentsSection';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { db } from '../lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const MessageCard = ({ message, onVote }) => {
    const [showComments, setShowComments] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { author, content, createdAt, votes, userVote, commentCount, subject, id, authorId } = message;
    const { currentUser } = useAuth();

    const isAuthor = currentUser?.uid === authorId;

    const handleDelete = async () => {
        if (!isAuthor) {
            toast.error("You can't delete someone else's post");
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this post?');
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, 'posts', id));
            toast.success('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Error deleting post');
        }
    };

    const formatVotes = (votes) => {
        if (votes >= 1000) {
            return `${(votes / 1000).toFixed(1)}k`;
        }
        return votes;
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <Card className="hover:border-msme-olive/30 transition-colors relative bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex">
                {/* Vote Column */}
                <div className="w-10 bg-msme-cream/30 p-2 flex flex-col items-center gap-1">
                    <button
                        className={`vote-button ${userVote === 'up' ? 'active-upvote' : ''}`}
                        onClick={() => onVote(id, 'up')}
                    >
                        <ArrowBigUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-msme-sage">
                        {formatVotes(votes)}
                    </span>
                    <button
                        className={`vote-button ${userVote === 'down' ? 'active-downvote' : ''}`}
                        onClick={() => onVote(id, 'down')}
                    >
                        <ArrowBigDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4">
                    {/* Post Header */}
                    <div className="flex items-center text-xs text-msme-sage/70 mb-2">
                        <span className="font-medium text-msme-sage">MSME</span>
                        <span className="mx-1">•</span>
                        <span>Posted by u/{author}</span>
                        <span className="mx-1">•</span>
                        <span>{formatTimeAgo(createdAt)}</span>
                    </div>

                    {/* Post Content */}
                    <h2 className="text-lg font-medium text-msme-sage mb-2">{subject}</h2>
                    <div className="mb-4">
                        <p className="text-sm text-msme-sage leading-relaxed">{content}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 text-msme-sage/70">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs hover:bg-msme-cream/50 transition-colors"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <MessageSquare className="w-4 h-4" />
                            {commentCount || 0} Comments
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs hover:bg-msme-cream/50 transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-xs hover:bg-msme-cream/50 transition-colors"
                        >
                            <BookmarkPlus className="w-4 h-4" />
                            Save
                        </Button>

                        {/* Three Dots Menu */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs hover:bg-msme-cream/50 transition-colors"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div
                                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-msme-sage/10 z-20"
                                    onMouseLeave={() => setShowDropdown(false)}
                                >
                                    <div className="py-1">
                                        {isAuthor && (
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-msme-cream/50 w-full text-left transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Post
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-4 border-t border-msme-sage/10 pt-4">
                            <CommentsSection postId={id} />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default MessageCard;