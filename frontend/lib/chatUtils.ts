export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  lastMessageAt: string;
  messageCount: number;
  messages: Message[];
}

/**
 * Groups messages into conversations based on time gaps (> 30 minutes)
 */
export function groupMessagesIntoConversations(messages: Message[]): Conversation[] {
  if (messages.length === 0) {
    return [];
  }

  const conversations: Conversation[] = [];
  let currentConversation: Message[] = [];

  // Sort messages by creation time (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedMessages.forEach((message, index) => {
    if (index === 0) {
      currentConversation = [message];
    } else {
      const prevMessage = sortedMessages[index - 1];
      const messageTime = new Date(message.createdAt);
      const prevMessageTime = new Date(prevMessage.createdAt);
      const timeDiff = messageTime.getTime() - prevMessageTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      // If gap > 30 minutes, start new conversation
      if (minutesDiff > 30) {
        // Save current conversation
        if (currentConversation.length > 0) {
          conversations.push(createConversation(currentConversation));
        }
        // Start new conversation
        currentConversation = [message];
      } else {
        currentConversation.push(message);
      }
    }
  });

  // Add last conversation
  if (currentConversation.length > 0) {
    conversations.push(createConversation(currentConversation));
  }

  // Reverse to show most recent first
  return conversations.reverse();
}

/**
 * Creates a conversation object from a group of messages
 */
function createConversation(messages: Message[]): Conversation {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  const lastMessage = messages[messages.length - 1];
  
  // Generate title from first user message (truncated to 50 chars)
  const title = firstUserMessage
    ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    : 'New Conversation';

  // Generate preview from last message
  const preview = lastMessage.content.slice(0, 60) + (lastMessage.content.length > 60 ? '...' : '');

  // Use first message timestamp as conversation ID (for uniqueness)
  const id = messages[0].id;

  return {
    id,
    title,
    preview,
    lastMessageAt: lastMessage.createdAt,
    messageCount: messages.length,
    messages,
  };
}
