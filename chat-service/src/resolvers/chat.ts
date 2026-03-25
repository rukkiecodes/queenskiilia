import { GraphQLError } from 'graphql';
import axios from 'axios';
import { db } from '../shared/db';
import { env } from '../config/env';

function requireAuth(ctx: any): string {
  if (!ctx.userId) {
    throw new GraphQLError('Unauthenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId as string;
}

async function requireParticipant(chatId: string, userId: string): Promise<any> {
  const { rows } = await db.query(
    'SELECT * FROM chats WHERE id = $1',
    [chatId]
  );

  if (rows.length === 0) {
    throw new GraphQLError('Chat not found', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  const chat = rows[0];

  if (chat.student_id !== userId && chat.business_id !== userId) {
    throw new GraphQLError('Forbidden', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return chat;
}

function rowToChat(row: any) {
  return {
    id:         row.id,
    projectId:  row.project_id,
    studentId:  row.student_id,
    businessId: row.business_id,
    createdAt:  row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  };
}

function rowToMessage(row: any) {
  return {
    id:             row.id,
    chatId:         row.chat_id,
    senderId:       row.sender_id,
    content:        row.content ?? null,
    attachmentUrls: row.attachment_urls ?? [],
    isRead:         row.is_read,
    sentAt:         row.sent_at instanceof Date
      ? row.sent_at.toISOString()
      : String(row.sent_at),
  };
}

export const chatResolvers = {
  Query: {
    chat: async (_: any, { projectId }: any, ctx: any) => {
      const userId = requireAuth(ctx);

      const { rows } = await db.query(
        'SELECT * FROM chats WHERE project_id = $1',
        [projectId]
      );

      if (rows.length === 0) return null;

      const chat = rows[0];

      if (chat.student_id !== userId && chat.business_id !== userId) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return rowToChat(chat);
    },

    chatMessages: async (_: any, { chatId, limit = 50, offset = 0 }: any, ctx: any) => {
      const userId = requireAuth(ctx);

      await requireParticipant(chatId, userId);

      const safeLimit = Math.min(Number(limit), 100);

      const { rows } = await db.query(
        `SELECT * FROM messages
         WHERE chat_id = $1
         ORDER BY sent_at DESC
         LIMIT $2 OFFSET $3`,
        [chatId, safeLimit, offset]
      );

      return rows.map(rowToMessage);
    },
  },

  Mutation: {
    sendMessage: async (_: any, { input }: any, ctx: any) => {
      const userId = requireAuth(ctx);
      const { chatId, content, attachmentUrls } = input;

      await requireParticipant(chatId, userId);

      const { rows } = await db.query(
        `INSERT INTO messages (chat_id, sender_id, content, attachment_urls, is_read, sent_at)
         VALUES ($1, $2, $3, $4, false, NOW())
         RETURNING *`,
        [chatId, userId, content ?? null, attachmentUrls ?? []]
      );

      const message = rowToMessage(rows[0]);

      // Fire-and-forget emit to main server
      axios.post(
        `${env.MAIN_SERVER_URL}/internal/emit`,
        {
          room:  `chat:${chatId}`,
          event: 'chat:message',
          data:  message,
        },
        {
          headers: { 'X-Internal-Secret': env.INTERNAL_SECRET },
          timeout: 5000,
        }
      ).catch((err: Error) => {
        console.error('[Chat] Emit failed:', err.message);
      });

      return message;
    },

    markMessagesRead: async (_: any, { chatId }: any, ctx: any) => {
      const userId = requireAuth(ctx);

      await requireParticipant(chatId, userId);

      const { rowCount } = await db.query(
        `UPDATE messages
         SET is_read = true
         WHERE chat_id = $1
           AND sender_id != $2
           AND is_read = false`,
        [chatId, userId]
      );

      return rowCount ?? 0;
    },
  },

  Chat: {
    __resolveReference: async (reference: any) => {
      const { rows } = await db.query(
        'SELECT * FROM chats WHERE id = $1',
        [reference.id]
      );

      if (rows.length === 0) return null;
      return rowToChat(rows[0]);
    },
  },

  Message: {
    __resolveReference: async (reference: any) => {
      const { rows } = await db.query(
        'SELECT * FROM messages WHERE id = $1',
        [reference.id]
      );

      if (rows.length === 0) return null;
      return rowToMessage(rows[0]);
    },
  },
};
