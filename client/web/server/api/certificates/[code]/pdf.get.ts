import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Server-side certificate PDF (pdf-lib). Public — verifies the code against the
// gateway, then renders a landscape certificate.
export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code') ?? ''
  const config = useRuntimeConfig()

  const res = await $fetch<any>(`${config.public.apiUrl}/graphql`, {
    method: 'POST',
    body: {
      query: `query($code:String!){ certificate(code:$code){ certificateCode skillName level scorePct grade talentName issuedAt isRevoked } }`,
      variables: { code },
    },
  }).catch(() => null)

  const cert = res?.data?.certificate
  if (!cert || cert.isRevoked) {
    throw createError({ statusCode: 404, statusMessage: 'Certificate not found' })
  }

  const doc = await PDFDocument.create()
  const page = doc.addPage([842, 595]) // A4 landscape
  const { width, height } = page.getSize()
  const navy = rgb(0.04, 0.15, 0.26)
  const gold = rgb(0.84, 0.7, 0.36)
  const white = rgb(1, 1, 1)
  const muted = rgb(0.8, 0.8, 0.85)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  page.drawRectangle({ x: 0, y: 0, width, height, color: navy })
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: gold, borderWidth: 2 })

  const origin = getRequestURL(event).origin
  try {
    const logoBytes = (await $fetch(`${origin}/logo.png`, { responseType: 'arrayBuffer' })) as ArrayBuffer
    const logo = await doc.embedPng(logoBytes)
    const lw = 90
    const lh = (logo.height / logo.width) * lw
    page.drawImage(logo, { x: width / 2 - lw / 2, y: height - 100 - lh, width: lw, height: lh })
  } catch {
    // logo optional
  }

  const center = (text: string, y: number, f: typeof font, size: number, color: typeof white) => {
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, { x: width / 2 - w / 2, y, size, font: f, color })
  }

  const gradeMap: Record<string, string> = { distinction: 'Distinction', merit: 'Merit', pass: 'Pass' }
  center('CERTIFICATE OF SKILL PROFICIENCY', height - 150, bold, 12, gold)
  center('This certifies that', height - 210, font, 13, muted)
  center(cert.talentName || 'QueenSkiilia Talent', height - 252, bold, 34, white)
  center(`has demonstrated ${gradeMap[cert.grade] ?? cert.grade ?? ''} proficiency in`, height - 292, font, 13, muted)
  center(cert.skillName, height - 338, bold, 26, gold)
  center(`${cert.level} level  ·  score ${Math.round(cert.scorePct ?? 0)}%`, height - 368, font, 12, muted)

  const issued = (() => {
    try {
      return new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return ''
    }
  })()
  page.drawText(`Issued  ${issued}`, { x: 60, y: 70, size: 10, font, color: rgb(0.7, 0.7, 0.75) })
  const cred = `Credential ID  ${cert.certificateCode}`
  page.drawText(cred, { x: width - 60 - font.widthOfTextAtSize(cred, 10), y: 70, size: 10, font, color: rgb(0.7, 0.7, 0.75) })
  center(`Verify at ${origin.replace(/^https?:\/\//, '')}/certificates/${cert.certificateCode}`, 46, font, 8, rgb(0.55, 0.55, 0.6))

  const pdfBytes = await doc.save()
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="QueenSkiilia-${cert.certificateCode}.pdf"`)
  return Buffer.from(pdfBytes)
})
