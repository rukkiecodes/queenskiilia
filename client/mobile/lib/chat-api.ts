import { gqlFetch } from './graphql-client';

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string | null;
  attachmentUrls: string[];
  isRead: boolean;
  sentAt: string;
};

export type Chat = {
  id: string;
  projectId: string;
  studentId: string;
  businessId: string;
  createdAt: string;
  lastMessage: Message | null;
  unreadCount: number;
};

const MESSAGE_FRAGMENT = `
  id
  chatId
  senderId
  content
  attachmentUrls
  isRead
  sentAt
`;

const CHAT_FRAGMENT = `
  id
  projectId
  studentId
  businessId
  createdAt
  unreadCount
  lastMessage { ${MESSAGE_FRAGMENT} }
`;

const MY_CHATS = `query MyChats { myChats { ${CHAT_FRAGMENT} } }`;

const GET_CHAT = `
  query GetChat($projectId: ID!) {
    chat(projectId: $projectId) { ${CHAT_FRAGMENT} }
  }
`;

const CHAT_MESSAGES = `
  query ChatMessages($chatId: ID!, $limit: Int, $offset: Int) {
    chatMessages(chatId: $chatId, limit: $limit, offset: $offset) { ${MESSAGE_FRAGMENT} }
  }
`;

const SEND_MESSAGE = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) { ${MESSAGE_FRAGMENT} }
  }
`;

const MARK_READ = `
  mutation MarkMessagesRead($chatId: ID!) {
    markMessagesRead(chatId: $chatId)
  }
`;

export type SendMessageInput = {
  chatId: string;
  content?: string;
  attachmentUrls?: string[];
};

export const chatApi = {
  myChats: () =>
    gqlFetch<{ myChats: Chat[] }>(MY_CHATS).then((r) => r.myChats),

  forProject: (projectId: string) =>
    gqlFetch<{ chat: Chat | null }>(GET_CHAT, { projectId }).then((r) => r.chat),

  messages: (chatId: string, limit = 50, offset = 0) =>
    gqlFetch<{ chatMessages: Message[] }>(CHAT_MESSAGES, {
      chatId,
      limit,
      offset,
    }).then((r) => r.chatMessages),

  send: (input: SendMessageInput) =>
    gqlFetch<{ sendMessage: Message }>(SEND_MESSAGE, { input }).then(
      (r) => r.sendMessage,
    ),

  markRead: (chatId: string) =>
    gqlFetch<{ markMessagesRead: number }>(MARK_READ, { chatId }).then(
      (r) => r.markMessagesRead,
    ),
};
