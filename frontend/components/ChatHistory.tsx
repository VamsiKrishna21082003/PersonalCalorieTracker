'use client';

import { format, formatDistanceToNow } from 'date-fns';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import { Conversation } from '@/lib/chatUtils';

interface ChatHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClose?: () => void;
}

export default function ChatHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClose,
}: ChatHistoryProps) {
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shadow-lg md:shadow-none">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-lg font-semibold text-gray-900 md:hidden">Conversations</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Button onClick={onNewChat} className="w-full" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No conversations"
              description="Start a new conversation to begin chatting with your nutrition assistant."
            />
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-lg transition-colors ${
                    isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="w-full text-left p-3 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mb-1">{conversation.preview}</p>
                        <p className="text-xs text-gray-400">{formatTimestamp(conversation.lastMessageAt)}</p>
                      </div>
                    </div>
                  </button>
                  {/* Delete button - show on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this conversation?')) {
                        onDeleteConversation(conversation.id);
                      }
                    }}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
