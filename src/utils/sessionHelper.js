// src/utils/sessionHelper.js
import { auth } from '../firebase';

export const checkSession = () => {
  const lastActivity = localStorage.getItem('lastActivity');
  const currentTime = new Date().getTime();
  
  if (lastActivity) {
    const inactiveTime = currentTime - parseInt(lastActivity);
    const hourInMillis = 60 * 60 * 1000;
    
    if (inactiveTime > hourInMillis) {
      auth.signOut();
      localStorage.removeItem('lastActivity');
      return false;
    }
  }
  
  localStorage.setItem('lastActivity', currentTime.toString());
  return true;
};

export const updateActivity = () => {
  localStorage.setItem('lastActivity', new Date().getTime().toString());
};
