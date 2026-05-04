/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { socket } from './lib/socket';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';

export default function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('error', (msg: string) => {
      setError(msg);
      setUser(null);
    });

    socket.on('connect_error', () => {
      setError('Connection refused. Is the server running?');
    });

    return () => {
      socket.off('error');
      socket.off('connect_error');
    };
  }, []);

  const handleJoin = (username: string, password: string) => {
    setError(null);
    socket.connect();
    socket.emit('join', { username, password });
    
    // Optimistically set user, though server could reject it
    // The server 'error' listener will handle rejections.
    setUser({ username });
  };

  const handleLogout = () => {
    socket.disconnect();
    setUser(null);
    setError(null);
  };

  if (!user) {
    return <JoinScreen onJoin={handleJoin} error={error} />;
  }

  return <ChatRoom currentUser={user.username} onLogout={handleLogout} />;
}
