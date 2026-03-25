import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    chat(projectId: ID!): Chat
    chatMessages(chatId: ID!, limit: Int, offset: Int): [Message!]!
  }

  type Mutation {
    sendMessage(input: SendMessageInput!): Message!
    markMessagesRead(chatId: ID!): Int!
  }

  type Chat @key(fields: "id") {
    id:         ID!
    projectId:  ID!
    studentId:  ID!
    businessId: ID!
    createdAt:  String!
  }

  type Message @key(fields: "id") {
    id:             ID!
    chatId:         ID!
    senderId:       ID!
    content:        String
    attachmentUrls: [String!]!
    isRead:         Boolean!
    sentAt:         String!
  }

  input SendMessageInput {
    chatId:         ID!
    content:        String
    attachmentUrls: [String!]
  }
`);
