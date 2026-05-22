import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    myNotifications(unreadOnly: Boolean, limit: Int, offset: Int): [Notification!]!
    unreadCount: Int!
    """
    Per-user category toggles. Auto-creates a default row (everything enabled)
    on first read so callers never have to handle a missing-prefs case.
    """
    myNotificationPreferences: NotificationPreferences!
  }

  type Mutation {
    markAsRead(id: ID!): Notification!
    markAllAsRead: Int!
    deleteNotification(id: ID!): Boolean!
    """
    Partial update — only fields present in the input change. Returns the
    fully resolved preferences row (defaults applied) so the client can drop
    the response straight into cache.
    """
    updateNotificationPreferences(input: UpdateNotificationPreferencesInput!): NotificationPreferences!
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

  type NotificationPreferences {
    userId:         ID!
    projectUpdates: Boolean!
    messages:       Boolean!
    payments:       Boolean!
    system:         Boolean!
    updatedAt:      String!
  }

  input UpdateNotificationPreferencesInput {
    projectUpdates: Boolean
    messages:       Boolean
    payments:       Boolean
    system:         Boolean
  }
`);
