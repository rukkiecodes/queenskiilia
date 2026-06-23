import { gqlFetch } from '~/lib/graphql-client'
import type { Report, SubmitReportInput } from '~/types/report'

const REPORT_FRAGMENT = `
  id reporterId targetType targetId reason details status adminNote createdAt reviewedAt
`

const SUBMIT_REPORT = `mutation SubmitReport($input: SubmitReportInput!) { submitReport(input: $input) { ${REPORT_FRAGMENT} } }`
const MY_REPORTS = `query MyReports { myReports { ${REPORT_FRAGMENT} } }`

export const reportsApi = {
  submit: (input: SubmitReportInput) =>
    gqlFetch<{ submitReport: Report }>(SUBMIT_REPORT, { input }).then((r) => r.submitReport),
  mine: () => gqlFetch<{ myReports: Report[] }>(MY_REPORTS).then((r) => r.myReports),
}
