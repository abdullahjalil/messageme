import React, { useState } from 'react';
import { Button } from './ui/button';
import { Image, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

const MessageInput = ({ topicId = null, topicName = null }) => {
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to post');
      return;
    }

    if (!subject.trim() || !newMessage.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    try {
      // Create the post document
      const postData = {
        subject: subject.trim(),
        content: newMessage.trim(),
        author: currentUser.displayName,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        votes: 1,
        userVotes: { [currentUser.uid]: 'up' },
        commentCount: 0,
        topicId: topicId, // Will be null for homepage posts
        topicName: topicName, // Will be null for homepage posts
      };

      const postRef = await addDoc(collection(db, 'posts'), postData);

      // If posting in a topic, update the topic's post count
      if (topicId) {
        const topicRef = doc(db, 'topics', topicId);
        await updateDoc(topicRef, {
          postCount: increment(1),
          lastActivityAt: serverTimestamp()
        });
      }

      setNewMessage('');
      setSubject('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post');
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-msme-sage mb-2">
          Join the conversation
        </h3>
        <p className="text-msme-sage/70">
          Log in to start posting{topicName ? ` in ${topicName}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Title"
          className="w-full p-2 border border-msme-sage/10 rounded-md focus:outline-none focus:ring-2 focus:ring-msme-gold/50"
        />
        
        <div className="rounded-md border border-msme-sage/10">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`What's on your mind${topicName ? ` about ${topicName}` : ''}?`}
            className="w-full p-4 text-sm min-h-[120px] focus:outline-none rounded-t-md"
          />
          
          <div className="flex items-center justify-between p-2 bg-msme-cream/10 border-t border-msme-sage/10">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-msme-sage/70 hover:text-msme-sage hover:bg-msme-cream/30"
              >
                <Image className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-msme-sage/70 hover:text-msme-sage hover:bg-msme-cream/30"
              >
                <Link className="w-5 h-5" />
              </Button>
            </div>
            
            <Button 
              type="submit"
              className="bg-msme-gold hover:bg-msme-gold/90 text-white px-4"
            >
              Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;