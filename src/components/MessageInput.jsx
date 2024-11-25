import React from 'react';
import { Button } from './ui/button';
import { Image, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MessageInput = ({ newMessage, setNewMessage, onSubmit, subject, setSubject }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Log in to post</h3>
        <p className="text-gray-600">Join the conversation by logging in to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="w-full p-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <div className="rounded-md border border-gray-200">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="What are your thoughts?"
          className="w-full p-4 text-sm min-h-[120px] focus:outline-none"
        />
        
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:bg-gray-200"
            >
              <Image className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:bg-gray-200"
            >
              <Link className="w-5 h-5" />
            </Button>
          </div>
          
          <Button 
            onClick={onSubmit}
            className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white px-4"
          >
            Post
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Posting as u/{currentUser.displayName}
      </div>
    </div>
  );
};

export default MessageInput;