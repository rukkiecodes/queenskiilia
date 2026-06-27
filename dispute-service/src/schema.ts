import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    dispute(id: ID!): Dispute
    projectDispute(projectId: ID!): Dispute
    myDisputes: [Dispute!]!
    """
    Reports the current user has submitted (most recent first). Used by the
    mobile UI to disable the report button after the first submission so a
    user can't double-report the same target.
    """
    myReports: [Report!]!

    # Admin-only queues (gated by ctx.isAdmin via the x-user-admin header)
    adminDisputes(status: String, limit: Int, offset: Int): [Dispute!]!
    adminReports(status: String, limit: Int, offset: Int): [Report!]!
  }

  type Mutation {
    raiseDispute(input: RaiseDisputeInput!): Dispute!
    resolveDispute(id: ID!, resolution: String!, adminNote: String): Dispute!

    """
    Content moderation hook (Google Play §8). Records a user-submitted
    report on a user, project, or message. Idempotent on
    (reporter, target_type, target_id) — a user can't double-report the
    same target while a prior report is still open.
    """
    submitReport(input: SubmitReportInput!): Report!

    # Admin-only (gated by ctx.isAdmin). resolveDispute is now admin-gated too.
    reviewReport(id: ID!, action: String!, adminNote: String): Report!
  }

  type Dispute @key(fields: "id") {
    id:         ID!
    projectId:  ID!
    raisedBy:   ID!
    reason:     String!
    evidence:   [String!]!
    status:     String!
    resolution: String
    adminNote:  String
    createdAt:  String!
    resolvedAt: String
    # Enriched context for the admin queue (null outside admin queries).
    projectTitle: String
    raiserName:   String
    businessName: String
    studentName:  String
  }

  input RaiseDisputeInput {
    projectId: ID!
    reason:    String!
    evidence:  [String!]
  }

  type Report @key(fields: "id") {
    id:         ID!
    reporterId: ID!
    """ One of: user, project, message. """
    targetType: String!
    targetId:   ID!
    """ Category code (spam, harassment, inappropriate, scam, other). """
    reason:     String!
    """ Optional free-form context the reporter wrote. """
    details:    String
    """ One of: open, reviewed, dismissed, actioned. """
    status:     String!
    adminNote:  String
    createdAt:  String!
    reviewedAt: String
    # Enriched context for the admin queue (null outside admin queries).
    reporterName: String
    targetLabel:  String
  }

  input SubmitReportInput {
    targetType: String!
    targetId:   ID!
    reason:     String!
    details:    String
  }
`);
