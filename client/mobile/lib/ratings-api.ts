import { gqlFetch } from './graphql-client';

export type ReviewerType = 'student' | 'business';

export type Rating = {
  id: string;
  projectId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerType: ReviewerType;
  quality: number | null;
  communication: number | null;
  speed: number | null;
  professionalism: number | null;
  paymentFairness: number | null;
  clarity: number | null;
  respect: number | null;
  comment: string | null;
  createdAt: string;
};

const RATING_FRAGMENT = `
  id
  projectId
  reviewerId
  revieweeId
  reviewerType
  quality
  communication
  speed
  professionalism
  paymentFairness
  clarity
  respect
  comment
  createdAt
`;

const USER_RATINGS = `
  query UserRatings($userId: ID!) {
    userRatings(userId: $userId) { ${RATING_FRAGMENT} }
  }
`;

const PROJECT_RATINGS = `
  query ProjectRatings($projectId: ID!) {
    projectRatings(projectId: $projectId) { ${RATING_FRAGMENT} }
  }
`;

const MY_RATINGS = `query MyRatings { myRatings { ${RATING_FRAGMENT} } }`;

const SUBMIT_RATING = `
  mutation SubmitRating($input: SubmitRatingInput!) {
    submitRating(input: $input) { ${RATING_FRAGMENT} }
  }
`;

export type SubmitRatingInput = {
  projectId: string;
  revieweeId: string;
  reviewerType: ReviewerType;
  quality?: number;
  communication?: number;
  speed?: number;
  professionalism?: number;
  paymentFairness?: number;
  clarity?: number;
  respect?: number;
  comment?: string;
};

export const ratingsApi = {
  forUser: (userId: string) =>
    gqlFetch<{ userRatings: Rating[] }>(USER_RATINGS, { userId }).then(
      (r) => r.userRatings,
    ),

  forProject: (projectId: string) =>
    gqlFetch<{ projectRatings: Rating[] }>(PROJECT_RATINGS, { projectId }).then(
      (r) => r.projectRatings,
    ),

  mine: () =>
    gqlFetch<{ myRatings: Rating[] }>(MY_RATINGS).then((r) => r.myRatings),

  submit: (input: SubmitRatingInput) =>
    gqlFetch<{ submitRating: Rating }>(SUBMIT_RATING, { input }).then(
      (r) => r.submitRating,
    ),
};

/**
 * Compute the mean of the non-null dimension scores on a rating.
 */
export function ratingMean(r: Rating): number | null {
  const dims = [
    r.quality,
    r.communication,
    r.speed,
    r.professionalism,
    r.paymentFairness,
    r.clarity,
    r.respect,
  ].filter((n): n is number => typeof n === 'number');
  if (!dims.length) return null;
  return dims.reduce((s, n) => s + n, 0) / dims.length;
}
