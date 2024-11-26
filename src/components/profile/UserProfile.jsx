import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  documentId
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Plus, Users, Calendar, MessageSquare } from 'lucide-react';
import CreateTopicModal from '../topics/CreateTopicModal';
import { Card } from '../ui/card';
import toast from 'react-hot-toast';
import MessageCard from '../MessageCard';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userTopics, setUserTopics] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const isOwnProfile = currentUser?.displayName === username;

  useEffect(() => {
    const fetchUserContent = async () => {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch user's topics
        console.log('Fetching topics for user:', username);
        const topicsRef = collection(db, 'topics');
        const topicsQuery = query(
          topicsRef,
          where('creatorName', '==', username)
        );

        const topicsSnapshot = await getDocs(topicsQuery);
        console.log('Topics snapshot:', topicsSnapshot.size, 'results');
        
        const topicsData = topicsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert timestamps to Date objects
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        });

        console.log('Processed topics data:', topicsData);
        setUserTopics(topicsData);

        // Fetch user's posts
        console.log('Fetching posts for user:', username);
        const postsRef = collection(db, 'posts');
        const postsQuery = query(
          postsRef,
          where('author', '==', username),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const postsSnapshot = await getDocs(postsQuery);
        console.log('Posts snapshot:', postsSnapshot.size, 'results');
        
        const postsData = postsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });

        console.log('Processed posts data:', postsData);
        setUserPosts(postsData);

      } catch (error) {
        console.error('Error fetching user content:', error);
        setError(error.message);
        toast.error('Error loading profile data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserContent();
  }, [username]);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-msme-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6 text-center">
          <h2 className="text-xl text-msme-sage mb-4">Error Loading Profile</h2>
          <p className="text-msme-sage/70 mb-4">{error}</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-msme-gold hover:bg-msme-gold/90 text-white"
          >
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-msme-sage to-msme-olive h-24"></div>
        <div className="p-6 -mt-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="bg-white w-16 h-16 rounded-full border-4 border-white flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-msme-sage">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-msme-sage">u/{username}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-msme-sage/70">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {userPosts.length} posts
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {userTopics.length} topics
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
              <Button
                onClick={() => setShowCreateTopic(true)}
                className="bg-msme-gold hover:bg-msme-gold/90 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Topic
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Topics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-msme-sage mb-4">Topics</h2>
        {userTopics.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-msme-sage/70">No topics created yet</p>
            {isOwnProfile && (
              <Button
                onClick={() => setShowCreateTopic(true)}
                className="mt-4 bg-msme-gold hover:bg-msme-gold/90 text-white"
              >
                Create Your First Topic
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {userTopics.map(topic => (
              <Link 
                to={`/topic/${topic.id}`} 
                key={topic.id}
                className="block transition-transform hover:-translate-y-1"
              >
                <Card className="h-full p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-medium text-msme-sage">{topic.name}</h3>
                  <p className="text-sm text-msme-sage/70 mt-1 line-clamp-2">
                    {topic.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-msme-sage/70">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {topic.memberCount || 0} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(topic.createdAt)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div>
        <h2 className="text-xl font-semibold text-msme-sage mb-4">Recent Posts</h2>
        {userPosts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-msme-sage/70">No posts yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {userPosts.map(post => (
              <MessageCard 
                key={post.id} 
                message={post}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <CreateTopicModal onClose={() => setShowCreateTopic(false)} />
      )}
    </div>
  );
};

export default UserProfile;