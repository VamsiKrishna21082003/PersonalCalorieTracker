'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';
import { Message } from '@/lib/chatUtils';

interface ChatInterfaceProps {
  messages: Message[];
  onNewMessage: (message: Message) => void;
  onMessagesUpdate: () => void;
}

export default function ChatInterface({ messages, onNewMessage, onMessagesUpdate }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    onNewMessage(tempUserMessage);

    try {
      const response = await api.post('/api/chat/message', {
        message: userMessage,
      });

      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.data.message,
        createdAt: new Date().toISOString(),
      };
      onNewMessage(aiMessage);

      // Refresh to get actual IDs after a short delay
      setTimeout(() => {
        onMessagesUpdate();
      }, 500);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Show user-friendly error message
      let errorMessage = error.response?.data?.message || error.message || 'Failed to send message. Please try again.';
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        errorMessage = 'Gemini API quota exceeded. Please check your Google Cloud account billing or try again later.';
      } else if (error.response?.data?.code === 'rate_limit_exceeded' || error.response?.data?.code === 'RESOURCE_EXHAUSTED') {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (deletingId) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/api/chat/message/${id}`);
      toast.success('Message deleted');
      onMessagesUpdate();
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      toast.error(error.response?.data?.message || 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-0 h-full">
      {/* Messages Container - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              }
              title="Start a conversation"
              description="Ask questions about your nutrition goals, meals, or get personalized advice. Try asking: 'What did I eat today?' or 'How am I doing with my goals?'"
            />
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[85%] lg:max-w-[75%] group`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {message.role === 'user' ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`relative px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Delete Button - Show on Hover */}
                    {message.role === 'user' && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deletingId === message.id}
                        className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-500 px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3 max-w-[85%] lg:max-w-[75%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-tl-none">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar - Sticky Bottom */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-4 text-sm resize-none transition-colors"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
