<script setup lang="ts">
import { fetchCertificate } from '~/lib/exams'

definePageMeta({ layout: 'public' })

const route = useRoute()
const code = route.params.code as string

const { data: cert } = await useAsyncData(`cert-${code}`, () => fetchCertificate(code).catch(() => null))

const valid = computed(() => cert.value && !cert.value.isRevoked)
const gradeLabel: Record<string, string> = {
  distinction: 'Distinction', merit: 'Merit', pass: 'Pass',
}

useSeoMeta({
  title: () => (cert.value ? `${cert.value.talentName} — ${cert.value.skillName} certificate` : 'Certificate'),
  description: () =>
    cert.value
      ? `${cert.value.talentName} is certified in ${cert.value.skillName} (${cert.value.level}) on QueenSkiilia.`
      : 'QueenSkiilia certificate verification.',
})
</script>

<template>
  <div class="cv">
    <div v-if="!cert" class="cv__msg">
      <f-icon icon="alert-circle" />
      <h1>Certificate not found</h1>
      <p>No certificate matches the code <code>{{ code }}</code>.</p>
    </div>

    <div v-else-if="cert.isRevoked" class="cv__msg cv__msg--bad">
      <f-icon icon="x-circle" />
      <h1>Certificate revoked</h1>
      <p>This certificate ({{ cert.certificateCode }}) is no longer valid.</p>
    </div>

    <template v-else>
      <div class="cert" id="cert">
        <div class="cert__inner">
          <img src="/logo.png" alt="QueenSkiilia" class="cert__logo" />
          <p class="cert__eyebrow">Certificate of Skill Proficiency</p>
          <p class="cert__pre">This certifies that</p>
          <h1 class="cert__name">{{ cert.talentName || 'QueenSkiilia Talent' }}</h1>
          <p class="cert__body">
            has demonstrated <strong>{{ gradeLabel[cert.grade ?? ''] ?? cert.grade }}</strong> proficiency in
          </p>
          <h2 class="cert__skill">{{ cert.skillName }}</h2>
          <p class="cert__level">{{ cert.level }} level · score {{ Math.round(cert.scorePct ?? 0) }}%</p>
          <div class="cert__foot">
            <div>
              <span class="cert__foot-lbl">Issued</span>
              <span>{{ fmtDate(cert.issuedAt) }}</span>
            </div>
            <div class="cert__seal"><f-icon icon="award" /></div>
            <div>
              <span class="cert__foot-lbl">Credential ID</span>
              <span>{{ cert.certificateCode }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="cv__bar">
        <span class="cv__verified"><f-icon icon="check-circle" /> Verified by QueenSkiilia</span>
        <a :href="`/api/certificates/${cert.certificateCode}/pdf`" class="cv__dl" download>
          <f-icon icon="download" /> Download PDF
        </a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cv {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 16px 60px;
}
.cv__msg {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.8;
}
.cv__msg :deep(svg) {
  font-size: 40px;
  opacity: 0.5;
}
.cv__msg--bad {
  color: #b91c1c;
}

.cert {
  background: linear-gradient(135deg, #0a2540, #0d3a66);
  border-radius: 18px;
  padding: 14px;
}
.cert__inner {
  border: 2px solid rgba(214, 178, 92, 0.6);
  border-radius: 12px;
  padding: 48px 40px;
  text-align: center;
  color: #fff;
}
.cert__logo {
  height: 60px;
  margin-bottom: 18px;
}
.cert__eyebrow {
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.78rem;
  color: #d6b25c;
  margin: 0 0 28px;
  font-weight: 700;
}
.cert__pre {
  opacity: 0.7;
  margin: 0;
}
.cert__name {
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  margin: 8px 0 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.cert__body {
  opacity: 0.82;
  margin: 0;
}
.cert__skill {
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  margin: 8px 0 4px;
  color: #d6b25c;
}
.cert__level {
  text-transform: capitalize;
  opacity: 0.75;
  margin: 0 0 36px;
}
.cert__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  padding-top: 22px;
  font-size: 0.84rem;
}
.cert__foot > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cert__foot > div:last-child {
  text-align: right;
}
.cert__foot-lbl {
  opacity: 0.55;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.cert__seal {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d6b25c;
  color: #0a2540;
  font-size: 24px;
}

.cv__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.cv__verified {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #047857;
  font-weight: 700;
}
.cv__dl {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgb(var(--fui-theme-primary));
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}
</style>
