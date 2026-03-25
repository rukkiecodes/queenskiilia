import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    myNotifications(unreadOnly: Boolean, limit: Int, offset: Int): [Notification!]!
    unreadCount: Int!
  }

  type Mutation {
    markAsRead(id: ID!): Notification!
    markAllAsRead: Int!
    deleteNotification(id: ID!): Boolean!
  }

  type Notification @key(fields: "id") {
    id:        ID!
    userId:    ID!
    type:      String!
    title:     String!
    body:      String!
    isRead:    Boolean!
    metadata:  String
    createdAt: String!
  }
`);
