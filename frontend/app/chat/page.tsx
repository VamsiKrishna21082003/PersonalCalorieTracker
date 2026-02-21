'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ChatInterface from '@/components/ChatInterface';
import ChatHistory from '@/components/ChatHistory';
import api from '@/lib/api';
import { groupMessagesIntoConversations, Message, Conversation } from '@/lib/chatUtils';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch all messages from API
  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/chat/history');
      setAllMessages(response.data);
      
      // Group messages into conversations
      const grouped = groupMessagesIntoConversations(response.data);
      
      // If we have an active conversation, try to find it in the new grouping
      // by matching the first message ID
      if (activeConversationId && grouped.length > 0) {
        const currentConv = conversations.find((c) => c.id === activeConversationId);
        if (currentConv && currentConv.messages.length > 0) {
          // Find conversation with matching first message
          const matchingConv = grouped.find(
            (g) => g.messages.length > 0 && g.messages[0].id === currentConv.messages[0].id
          );
          if (matchingConv) {
            setActiveConversationId(matchingConv.id);
          } else if (grouped.length > 0) {
            // If no match, use most recent
            setActiveConversationId(grouped[0].id);
          }
        }
      } else if (grouped.length > 0 && !activeConversationId) {
        // Set active conversation to most recent if no active conversation
        setActiveConversationId(grouped[0].id);
      }
      
      setConversations(grouped);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Get messages for active conversation
  const activeMessages = activeConversationId
    ? conversations.find((c) => c.id === activeConversationId)?.messages || []
    : [];

  const handleNewChat = () => {
    setActiveConversationId(null);
    toast.success('New chat started');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    try {
      // Delete all messages in the conversation
      await Promise.all(
        conversation.messages.map((msg) => api.delete(`/api/chat/message/${msg.id}`))
      );
      
      toast.success('Conversation deleted');
      
      // Refresh conversations
      await fetchHistory();
      
      // If deleted conversation was active, switch to most recent
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleNewMessage = (message: Message) => {
    // If no active conversation, create a new one
    if (!activeConversationId) {
      const newConversation: Conversation = {
        id: `new-${Date.now()}`,
        title: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
        preview: message.content.slice(0, 60) + (message.content.length > 60 ? '...' : ''),
        lastMessageAt: message.createdAt,
        messageCount: 1,
        messages: [message],
      };
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation.id);
    } else {
      // Add message to active conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                lastMessageAt: message.createdAt,
                messageCount: conv.messageCount + 1,
                title: conv.messages.length === 0 
                  ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                  : conv.title,
              }
            : conv
        )
      );
    }
    
    // Refresh to get actual message IDs after AI response
    setTimeout(() => {
      fetchHistory();
    }, 2000);
  };

  const handleMessagesUpdate = () => {
    fetchHistory();
  };

  if (loadingHistory) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center flex-1 bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-0px)] bg-gray-50 flex flex-col relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat History Sidebar */}
          <div
            className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
          >
            <ChatHistory
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                handleSelectConversation(id);
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              onNewChat={() => {
                handleNewChat();
                setIsSidebarOpen(false); // Close sidebar on mobile after new chat
              }}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col min-w-0">
            <ChatInterface
              messages={activeMessages}
              onNewMessage={handleNewMessage}
              onMessagesUpdate={handleMessagesUpdate}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
