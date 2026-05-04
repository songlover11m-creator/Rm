import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { Send, Users, LogOut, Smile, Menu, X, Shield } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

interface User {
  id: string;
  username: string;
}

interface ChatRoomProps {
  currentUser: string;
  onLogout: () => void;
}

export default function ChatRoom({ currentUser, onLogout }: ChatRoomProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('history', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('userList', (userList: User[]) => {
      setUsers(userList);
    });

    socket.on('userTyping', ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      if (isTyping && username !== currentUser) {
        setIsTyping(username);
      } else {
        setIsTyping(null);
      }
    });

    return () => {
      socket.off('message');
      socket.off('history');
      socket.off('userList');
      socket.off('userTyping');
    };
  }, [currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('sendMessage', message.trim());
      setMessage('');
      setShowEmojiPicker(false);
      socket.emit('typing', false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    socket.emit('typing', true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 2000);
  };

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-panel transform transition-transform duration-300 lg:relative lg:translate-x-0 border-r border-white/10",
        showUserList ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-lg">Circle</h2>
            </div>
            <button onClick={() => setShowUserList(false)} className="lg:hidden p-1 hover:bg-white/5 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="mb-4 text-xs font-medium text-slate-500 uppercase tracking-wider px-2">
              Online — {users.length}
            </div>
            <div className="space-y-1">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    user.username === currentUser ? "bg-teal-500/10 text-teal-400" : "hover:bg-white/5"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                  <span className="text-sm font-medium">{user.username} {user.username === currentUser && '(You)'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Leave Circle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-4 lg:px-8 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowUserList(true)} className="lg:hidden p-2 hover:bg-white/5 rounded-full">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-tight uppercase tracking-widest text-teal-400">CircleChat</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase italic">Secure Connection Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold">{currentUser}</span>
                <span className="text-[10px] text-teal-500 font-mono">ENCRYPTED</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300">
                {currentUser.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar space-y-4 pb-24">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isMe = msg.username === currentUser;
              const showAvatar = index === 0 || messages[index - 1].username !== msg.username;
              
              if (msg.isSystem) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className="flex justify-center my-6"
                  >
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                      {msg.text}
                    </span>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[85%] lg:max-w-[70%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  {!isMe && showAvatar && (
                    <span className="text-[11px] font-bold text-teal-500/80 mb-1 ml-1 uppercase tracking-wider">{msg.username}</span>
                  )}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl group relative",
                    isMe 
                      ? "bg-teal-600/90 text-white rounded-tr-none shadow-[0_4px_12px_rgba(13,148,136,0.2)]" 
                      : "bg-slate-800/80 text-slate-100 rounded-tl-none border border-white/5"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <time className={cn(
                      "text-[9px] opacity-0 group-hover:opacity-60 transition-opacity absolute bottom-1",
                      isMe ? "right-2" : "left-2"
                    )}>
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </time>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-24 left-8 text-[11px] text-slate-500 italic flex items-center gap-2"
            >
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              {isTyping} is typing...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input */}
        <div className="absolute bottom-4 left-4 right-4 lg:left-8 lg:right-8 z-40">
          <form 
            onSubmit={handleSendMessage}
            className="glass-panel p-2 rounded-2xl shadow-2xl flex items-center gap-2 relative"
          >
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                title="Add Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl"
                  >
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={Theme.DARK}
                      width={320}
                      height={400}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input 
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Type your secure message..."
              className="flex-1 bg-transparent border-none outline-none py-2 text-sm placeholder:text-slate-600"
            />

            <button 
              type="submit"
              disabled={!message.trim()}
              className="p-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:hover:bg-teal-500 text-white rounded-xl transition-all shadow-lg active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
