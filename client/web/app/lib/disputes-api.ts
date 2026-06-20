import { gqlFetch } from '~/lib/graphql-client'
import type { Dispute, RaiseDisputeInput } from '~/types/dispute'

const DISPUTE_FRAGMENT = `
  id projectId raisedBy reason evidence status resolution adminNote createdAt resolvedAt
`

const PROJECT_DISPUTE = `query ProjectDispute($projectId: ID!) { projectDispute(projectId: $projectId) { ${DISPUTE_FRAGMENT} } }`
const MY_DISPUTES = `query MyDisputes { myDisputes { ${DISPUTE_FRAGMENT} } }`
const RAISE_DISPUTE = `mutation RaiseDispute($input: RaiseDisputeInput!) { raiseDispute(input: $input) { ${DISPUTE_FRAGMENT} } }`

export const disputesApi = {
  forProject: (projectId: string) =>
    gqlFetch<{ projectDispute: Dispute | null }>(PROJECT_DISPUTE, { projectId }).then(
      (r) => r.projectDispute,
    ),
  mine: () => gqlFetch<{ myDisputes: Dispute[] }>(MY_DISPUTES).then((r) => r.myDisputes),
  raise: (input: RaiseDisputeInput) =>
    gqlFetch<{ raiseDispute: Dispute }>(RAISE_DISPUTE, { input }).then((r) => r.raiseDispute),
}
