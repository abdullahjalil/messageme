import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import MessageCard from '../MessageCard';
import MessageInput from '../MessageInput';
import {
  Users,
  Settings,
  Calendar,
  TrendingUp,
  Clock,
  ChevronDown,
  AlertCircle,
  Shield,
  Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { id: 'new', label: 'New', icon: Clock },
  { id: 'top', label: 'Top', icon: TrendingUp },
  { id: 'hot', label: 'Hot', icon: TrendingUp },
];

const TopicPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('new');
  const [isMember, setIsMember] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  // Fetch topic data
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const topicDoc = await getDoc(doc(db, 'topics', topicId));
        if (topicDoc.exists()) {
          const topicData = { id: topicDoc.id, ...topicDoc.data() };
          setTopic(topicData);
          setMemberCount(topicData.memberCount || 0);
          if (currentUser) {
            setIsMember(topicData.members?.includes(currentUser.uid));
            setIsModerator(
              currentUser.uid === topicData.createdBy || 
              topicData.moderators?.includes(currentUser.uid)
            );
          }
        } else {
          toast.error('Topic not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching topic:', error);
        toast.error('Error loading topic');
      }
    };

    fetchTopic();
  }, [topicId, currentUser, navigate]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!topic) return;

      try {
        let postsQuery = query(
          collection(db, 'posts'),
          where('topicId', '==', topicId)
        );

        switch (sortBy) {
          case 'top':
            postsQuery = query(postsQuery, orderBy('votes', 'desc'));
            break;
          case 'hot':
            postsQuery = query(postsQuery, orderBy('commentCount', 'desc'));
            break;
          default: // 'new'
            postsQuery = query(postsQuery, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(postsQuery);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Error loading posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [topic, sortBy, topicId]);

  const handleJoin = async () => {
    if (!currentUser) {
      toast.error('Please log in to join topics');
      return;
    }

    try {
      const topicRef = doc(db, 'topics', topicId);
      if (isMember) {
        await updateDoc(topicRef, {
          members: arrayRemove(currentUser.uid),
          memberCount: increment(-1)
        });
        setIsMember(false);
        setMemberCount(prev => prev - 1);
        toast.success(`Left ${topic.name}`);
      } else {
        await updateDoc(topicRef, {
          members: arrayUnion(currentUser.uid),
          memberCount: increment(1)
        });
        setIsMember(true);
        setMemberCount(prev => prev + 1);
        toast.success(`Joined ${topic.name}`);
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      toast.error('Error updating membership');
    }
  };

  const handleVote = async (postId, direction) => {
    if (!currentUser) {
      toast.error('Please log in to vote');
      return;
    }

    // Find the post
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const currentVote = post.userVotes?.[currentUser.uid];
      
      if (currentVote === direction) {
        // Remove vote
        await updateDoc(postRef, {
          [`userVotes.${currentUser.uid}`]: null,
          votes: increment(direction === 'up' ? -1 : 1)
        });
      } else {
        // Add or change vote
        const voteDiff = currentVote ? 2 : 1;
        await updateDoc(postRef, {
          [`userVotes.${currentUser.uid}`]: direction,
          votes: increment(direction === 'up' ? voteDiff : -voteDiff)
        });
      }

      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const newVotes = currentVote === direction
            ? p.votes + (direction === 'up' ? -1 : 1)
            : p.votes + (direction === 'up' ? 1 : -1);
          return {
            ...p,
            votes: newVotes,
            userVotes: {
              ...p.userVotes,
              [currentUser.uid]: currentVote === direction ? null : direction
            }
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error updating vote:', error);
      toast.error('Error updating vote');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-msme-gold"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl text-msme-sage">Topic not found</h2>
        <Link to="/" className="text-msme-gold hover:underline mt-2 inline-block">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Topic Header */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-msme-sage">{topic.name}</h1>
              <p className="text-msme-sage/70 mt-2">{topic.description}</p>
              
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center text-msme-sage/70">
                  <Users className="w-4 h-4 mr-1" />
                  {memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}
                </div>
                <div className="flex items-center text-msme-sage/70">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {new Date(topic.createdAt?.seconds * 1000).toLocaleDateString()}
                </div>
                {isModerator && (
                  <div className="flex items-center text-msme-sage/70">
                    <Shield className="w-4 h-4 mr-1" />
                    Moderator
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleJoin}
                className={`${
                  isMember 
                    ? 'bg-msme-sage/10 text-msme-sage hover:bg-msme-sage/20'
                    : 'bg-msme-gold hover:bg-msme-gold/90 text-white'
                }`}
              >
                {isMember ? 'Joined' : 'Join'}
              </Button>
              
              {isModerator && (
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/topic/${topicId}/settings`)}
                  className="text-msme-sage/70 hover:text-msme-sage"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="mb-4 flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
            {SORT_OPTIONS.map(option => (
              <Button
                key={option.id}
                variant="ghost"
                size="sm"
                onClick={() => setSortBy(option.id)}
                className={`flex items-center gap-1 ${
                  sortBy === option.id ? 'bg-msme-cream/50' : ''
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </Button>
            ))}
          </div>

          {/* Create Post */}
          <div className="mb-6">
            <MessageInput topicId={topicId} topicName={topic.name} />
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <MessageCard 
                  key={post.id} 
                  message={post}
                  onVote={handleVote}
                />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-msme-sage/70">No posts yet in this topic</p>
                {currentUser && (
                  <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-4 bg-msme-gold hover:bg-msme-gold/90 text-white"
                  >
                    Create the first post
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 shrink-0 space-y-4">
          {/* About Card */}
          <Card className="p-4 bg-white">
            <h3 className="font-medium text-msme-sage mb-4">About Topic</h3>
            <div className="space-y-4 text-sm">
              <p className="text-msme-sage/70">{topic.description}</p>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-msme-sage/70 mb-2">
                  <span>Created</span>
                  <span>{new Date(topic.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-msme-sage/70 mb-2">
                  <span>Members</span>
                  <span>{memberCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-msme-sage/70">
                  <span>Posts</span>
                  <span>{topic.postCount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Rules Card */}
          {topic.rules && (
            <Card className="p-4 bg-white">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowRules(!showRules)}
              >
                <h3 className="font-medium text-msme-sage">Topic Rules</h3>
                <ChevronDown 
                  className={`w-5 h-5 text-msme-sage/70 transform transition-transform ${
                    showRules ? 'rotate-180' : ''
                  }`} 
                />
              </div>
              
              {showRules && (
                <div className="mt-4 text-sm text-msme-sage/70 whitespace-pre-line">
                  {topic.rules}
                </div>
              )}
            </Card>
          )}

          {/* Moderators Card */}
          <Card className="p-4 bg-white">
            <h3 className="font-medium text-msme-sage mb-4">Moderators</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-msme-sage/70">
                <Shield className="w-4 h-4" />
                <Link 
                  to={`/user/${topic.creatorName}`}
                  className="hover:text-msme-gold transition-colors"
                >
                  u/{topic.creatorName}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TopicPage;