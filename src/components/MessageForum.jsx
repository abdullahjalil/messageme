import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import MessageInput from './MessageInput';
import MessageCard from './MessageCard';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const MessageForum = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Create a query with explicit ordering
    const q = query(
      collection(db, 'posts'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamp to Date
          const createdAt = data.createdAt instanceof Timestamp ? 
            data.createdAt.toDate().toISOString() : 
            new Date().toISOString();
          
          return {
            id: doc.id,
            ...data,
            createdAt
          };
        });
        setMessages(newMessages);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        toast.error('Error loading posts');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to post');
      return;
    }

    if (!newMessage.trim() || !subject.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    try {
      const postData = {
        subject: subject.trim(),
        content: newMessage.trim(),
        author: currentUser.displayName,
        authorId: currentUser.uid,
        votes: 1,
        userVotes: { [currentUser.uid]: 'up' },
        commentCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts'), postData);

      setNewMessage('');
      setSubject('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post');
    }
  };

  const handleVote = async (messageId, direction) => {
    if (!currentUser) {
      toast.error('Please log in to vote');
      return;
    }

    const messageRef = doc(db, 'posts', messageId);
    const message = messages.find(m => m.id === messageId);
    const currentVote = message.userVotes?.[currentUser.uid];
    
    try {
      if (currentVote === direction) {
        // Remove vote
        await updateDoc(messageRef, {
          votes: increment(direction === 'up' ? -1 : 1),
          [`userVotes.${currentUser.uid}`]: null
        });
      } else {
        // Add or change vote
        const voteDiff = currentVote ? 2 : 1;
        await updateDoc(messageRef, {
          votes: increment(direction === 'up' ? voteDiff : -voteDiff),
          [`userVotes.${currentUser.uid}`]: direction
        });
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      toast.error('Error updating vote');
    }
  };

  return (
    <div>
      <Card className="mb-4 p-4 divide-y divide-gray-200">
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          subject={subject}
          setSubject={setSubject}
          onSubmit={handleSubmit}
        />
      </Card>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : messages.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No posts yet. Be the first to post!
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map(message => (
            <MessageCard 
              key={message.id} 
              message={{
                ...message,
                userVote: message.userVotes?.[currentUser?.uid]
              }}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageForum;