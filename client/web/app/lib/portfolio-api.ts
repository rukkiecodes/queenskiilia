import { gqlFetch } from '~/lib/graphql-client'
import type { PortfolioItem } from '~/types/portfolio'

// Ported from client/mobile/lib/portfolio-api.ts.
const ITEM_FRAGMENT = `
  id studentId projectId projectTitle businessName description
  skills fileUrls clientRating clientReview isPublic completedAt createdAt
`

const MY_PORTFOLIO = `query MyPortfolio { myPortfolio { ${ITEM_FRAGMENT} } }`
const STUDENT_PORTFOLIO = `query StudentPortfolio($studentId: ID!) { studentPortfolio(studentId: $studentId) { ${ITEM_FRAGMENT} } }`
const GET_PORTFOLIO_ITEM = `query PortfolioItem($id: ID!) { portfolioItem(id: $id) { ${ITEM_FRAGMENT} } }`
const UPDATE_VISIBILITY = `
  mutation UpdatePortfolioItemVisibility($id: ID!, $isPublic: Boolean!) {
    updatePortfolioItemVisibility(id: $id, isPublic: $isPublic) { ${ITEM_FRAGMENT} }
  }
`

export const portfolioApi = {
  mine: () => gqlFetch<{ myPortfolio: PortfolioItem[] }>(MY_PORTFOLIO).then((r) => r.myPortfolio),

  forStudent: (studentId: string) =>
    gqlFetch<{ studentPortfolio: PortfolioItem[] }>(STUDENT_PORTFOLIO, { studentId }).then(
      (r) => r.studentPortfolio,
    ),

  get: (id: string) =>
    gqlFetch<{ portfolioItem: PortfolioItem | null }>(GET_PORTFOLIO_ITEM, { id }).then(
      (r) => r.portfolioItem,
    ),

  setVisibility: (id: string, isPublic: boolean) =>
    gqlFetch<{ updatePortfolioItemVisibility: PortfolioItem }>(UPDATE_VISIBILITY, {
      id,
      isPublic,
    }).then((r) => r.updatePortfolioItemVisibility),
}
