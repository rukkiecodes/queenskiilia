<script setup lang="ts">
import { projectsApi } from '~/lib/projects-api'
import { profileApi } from '~/lib/profile-api'
import ProjectCard from '~/components/cards/project-card.vue'
import TalentCard from '~/components/cards/talent-card.vue'

// Public landing entry for the web app (distinct from the marketing landing/ site).
definePageMeta({ layout: 'public' })
useSeoMeta({
  title: 'QueenSkiilia — Verified talent, real projects',
  description:
    'Hire verified student talent or get paid for real work. Skill-tested, escrow-protected, dispute-backed.',
})

// Open opportunities — paginated 9 per page (anonymous queries are allowed).
const PER_PAGE = 9
const page = ref(1)
const { data: gigs, pending: gigsPending } = await useAsyncData(
  'landing-gigs',
  () =>
    projectsApi
      .list({ status: 'open', limit: PER_PAGE, offset: (page.value - 1) * PER_PAGE })
      .catch(() => []),
  { watch: [page] },
)
const hasPrev = computed(() => page.value > 1)
const hasNext = computed(() => (gigs.value?.length ?? 0) === PER_PAGE)
function prevPage() {
  if (hasPrev.value) {
    page.value--
    if (import.meta.client) window.scrollTo({ top: 0 })
  }
}
function nextPage() {
  if (hasNext.value) {
    page.value++
    if (import.meta.client) window.scrollTo({ top: 0 })
  }
}

// Featured verified talent.
const { data: talents } = await useAsyncData('landing-talents', () =>
  profileApi.searchUsers({ accountType: 'student', limit: 8 }).catch(() => []),
)

const steps = [
  { n: '01', icon: 'edit-3', title: 'Post a project', text: 'Describe the work, set a budget, and publish it to a pool of skill-tested talent.' },
  { n: '02', icon: 'users', title: 'Pick verified talent', text: 'Review profiles, skill levels and ratings, then select the right person and fund escrow.' },
  { n: '03', icon: 'shield', title: 'Approve & release', text: 'Collaborate in the workspace. Funds release to the talent only when you approve the work.' },
]

const features = [
  { icon: 'lock', title: 'Escrow-protected pay', text: 'Money is held safely until the work is approved — protection for both sides.' },
  { icon: 'award', title: 'Skill-tested talent', text: 'Timed assessments verify real ability and unlock higher-tier projects.' },
  { icon: 'check-circle', title: 'Verified profiles', text: 'ID verification and bilateral ratings keep the marketplace trustworthy.' },
  { icon: 'message-circle', title: 'Real-time workspace', text: 'Chat, share files and track submissions in one place per project.' },
  { icon: 'alert-triangle', title: 'Dispute resolution', text: 'Raise a dispute to freeze escrow and get a fair, reviewed outcome.' },
  { icon: 'briefcase', title: 'Auto-built portfolios', text: 'Every approved project becomes a portfolio piece that wins the next one.' },
]

const studentPerks = [
  'Prove your skills and unlock higher-tier projects',
  'Build a portfolio automatically as you deliver',
  'Get paid straight to your bank, protected by escrow',
]
const bizPerks = [
  'Access skill-tested, ID-verified students',
  'Fund escrow and release only on approval',
  'Dispute resolution backs every project',
]

const stats = [
  { value: '100%', label: 'Escrow-protected payments' },
  { value: '7-point', label: 'Bilateral rating system' },
  { value: 'ID-verified', label: 'Talent & businesses' },
  { value: 'Dispute-backed', label: 'Every transaction' },
]

const categories = [
  'Software Development', 'UI/UX Design', 'Graphic Design', 'Copywriting',
  'Digital Marketing', 'Data Analysis', 'Video Editing', 'Photography', 'Virtual Assistance',
]
</script>

<template>
  <div class="home">
    <!-- ── Hero (FHero — Fusion UI) ───────────────────────── -->
    <f-hero>
      <f-eyebrow dot class="hero__eyebrow">Verified talent ecosystem</f-eyebrow>
        <h1 class="hero__title">Real projects.<br />Verified talent.<br /><span class="hero__accent">Escrow-protected pay.</span></h1>
        <p class="hero__lede">
          QueenSkiilia connects skill-tested students with businesses that need work done — payments
          held safely in escrow until the job is approved.
        </p>
        <div class="hero__cta">
          <f-btn color="primary" size="large" rounded @click="navigateTo('/onboarding')">Get started — it's free</f-btn>
          <f-btn variant="text" color="primary" size="large" append-icon="arrow-right" @click="navigateTo('/talent')">
            Browse talent
          </f-btn>
        </div>
        <p class="hero__note"><f-icon icon="lock" /> No fees to join · Funds protected end-to-end</p>

      <!-- Product mockup -->
      <template #visual>
        <div class="mock">
          <div class="mock__head">
            <span class="mock__title">Landing page redesign</span>
            <f-status-pill color="warning">In escrow</f-status-pill>
          </div>
          <div class="mock__row">
            <span class="mock__avatar">A</span>
            <div class="mock__who"><strong>Ada Okafor</strong><span>Advanced · ★ 4.9</span></div>
            <span class="mock__amount">₦250,000</span>
          </div>
          <div class="mock__bar"><span class="mock__bar-fill" /></div>
          <div class="mock__steps">
            <span class="mock__step mock__step--done"><f-icon icon="check" /> Funded</span>
            <span class="mock__step mock__step--done"><f-icon icon="check" /> Submitted</span>
            <span class="mock__step mock__step--active">Approve &amp; release</span>
          </div>
        </div>
        <div class="mock mock--ghost">
          <div class="mock__row">
            <span class="mock__avatar mock__avatar--alt">C</span>
            <div class="mock__who"><strong>Carlos Mendez</strong><span>Designer · ★ 4.8</span></div>
            <f-status-pill color="success">Paid out</f-status-pill>
          </div>
        </div>
      </template>
    </f-hero>

    <!-- ── Open opportunities (paginated, 9 per page) ──────── -->
    <f-section
      v-if="(gigs && gigs.length) || page > 1"
      eyebrow="Open opportunities"
      title="Fresh gigs, ready for talent"
    >
      <div class="gigs">
        <ProjectCard v-for="p in (gigs ?? [])" :key="p.id" :project="p" />
      </div>
      <p v-if="!gigsPending && !(gigs && gigs.length)" class="gigs__empty">
        No more projects on this page.
      </p>
      <div v-if="hasPrev || hasNext" class="gigs__pager">
        <f-btn variant="outlined" :disabled="!hasPrev || gigsPending" prepend-icon="arrow-left" @click="prevPage">
          Previous
        </f-btn>
        <span class="gigs__page">Page {{ page }}</span>
        <f-btn variant="outlined" :disabled="!hasNext || gigsPending" append-icon="arrow-right" @click="nextPage">
          Next
        </f-btn>
      </div>
    </f-section>

    <!-- ── Featured talent ─────────────────────────────────── -->
    <f-section
      v-if="talents && talents.length"
      eyebrow="Meet the talent"
      title="Skill-tested, verified students"
    >
      <div class="talents">
        <TalentCard v-for="t in talents" :key="t.id" :user="t" />
      </div>
      <div class="talents__cta">
        <f-btn variant="outlined" color="primary" rounded @click="navigateTo('/talent')">
          Browse all talent
        </f-btn>
      </div>
    </f-section>

    <!-- ── Trust strip (FStat — Fusion UI) ────────────────── -->
    <section class="trust">
      <f-stat v-for="s in stats" :key="s.label" :value="s.value" :label="s.label" />
    </section>

    <!-- ── How it works (FSection + FSteps — Fusion UI) ───── -->
    <f-section eyebrow="How it works" title="From idea to delivered — safely">
      <f-steps :items="steps" />
    </f-section>

    <!-- ── Features (FSection) ────────────────────────────── -->
    <f-section eyebrow="Built for trust" title="Everything a fair marketplace needs">
      <div class="features">
        <f-feature
          v-for="f in features"
          :key="f.title"
          :icon="f.icon"
          :title="f.title"
          :text="f.text"
          hover
        />
      </div>
    </f-section>

    <!-- ── Dual audience ──────────────────────────────────── -->
    <f-section>
      <div class="audience">
      <f-value-card accent tag="For students" title="Get paid for real work">
        <f-check-list :items="studentPerks" class="aud__list" />
        <f-btn color="primary" rounded @click="navigateTo('/onboarding')">Start earning</f-btn>
      </f-value-card>
      <f-value-card tag="For businesses" title="Hire vetted talent, pay with confidence">
        <f-check-list :items="bizPerks" class="aud__list" />
        <f-btn color="primary" variant="outlined" rounded @click="navigateTo('/onboarding')">Post a project</f-btn>
      </f-value-card>
      </div>
    </f-section>

    <!-- ── Categories (FSection center) ───────────────────── -->
    <f-section center eyebrow="Popular categories" title="Talent for every kind of work">
      <div class="cats">
        <f-chip v-for="c in categories" :key="c">{{ c }}</f-chip>
      </div>
    </f-section>

    <!-- ── Final CTA (FCta — Fusion UI) ───────────────────── -->
    <f-cta
      title="Ready to build something?"
      text="Join QueenSkiilia today — it takes a minute, and it's free to start."
    >
      <f-btn color="primary" size="large" rounded @click="navigateTo('/onboarding')">Get started</f-btn>
      <f-btn variant="outlined" color="primary" size="large" rounded @click="navigateTo('/login')">
        I have an account
      </f-btn>
    </f-cta>
  </div>
</template>

<style scoped>
.home {
  --gap: clamp(56px, 9vw, 120px);
  position: relative;
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  padding-bottom: var(--gap);
}
/* ── Hero ─────────────────────────────────────────────── */
.hero__eyebrow {
  margin-bottom: 22px;
}
.hero__title {
  font-size: clamp(2.5rem, 6vw, 4.1rem);
  line-height: 1.04;
  letter-spacing: -0.035em;
  font-weight: 800;
  margin: 0 0 22px;
}
.hero__accent {
  color: rgb(var(--fui-theme-primary));
}
.hero__lede {
  font-size: clamp(1.05rem, 1.7vw, 1.25rem);
  line-height: 1.55;
  opacity: 0.72;
  max-width: 520px;
  margin: 0 0 30px;
}
.hero__cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.hero__note {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 22px 0 0;
  font-size: 0.85rem;
  opacity: 0.55;
}

/* Product mockup */
.mock {
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-xl, 20px);
  background: rgb(var(--fui-theme-surface));
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mock--ghost {
  margin: 0 18px;
  opacity: 0.85;
}
.mock__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mock__title {
  font-weight: 700;
}
.mock__row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mock__avatar {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
  background: rgb(var(--fui-theme-primary));
  flex-shrink: 0;
}
.mock__avatar--alt {
  background: rgb(var(--fui-theme-warning));
}
.mock__who {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  flex: 1;
}
.mock__who span {
  font-size: 0.8rem;
  opacity: 0.6;
}
.mock__amount {
  font-weight: 700;
}
.mock__bar {
  height: 6px;
  border-radius: 9999px;
  background: rgba(var(--fui-theme-on-background), 0.1);
  overflow: hidden;
}
.mock__bar-fill {
  display: block;
  height: 100%;
  width: 66%;
  border-radius: 9999px;
  background: rgb(var(--fui-theme-primary));
}
.mock__steps {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mock__step {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--fui-theme-on-background), 0.06);
  opacity: 0.7;
}
.mock__step--done {
  color: rgb(var(--fui-theme-success));
  opacity: 1;
}
.mock__step--active {
  background: rgba(var(--fui-theme-primary), 0.14);
  color: rgb(var(--fui-theme-primary));
  opacity: 1;
}

/* ── Trust strip ──────────────────────────────────────── */
.trust {
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
  padding: 0 clamp(16px, 5vw, 48px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
/* ── Features ─────────────────────────────────────────── */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
/* ── Open gigs ────────────────────────────────────────── */
.gigs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.gigs__empty {
  text-align: center;
  opacity: 0.6;
  margin: 8px 0 0;
}
.gigs__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
}
.gigs__page {
  font-weight: 600;
  opacity: 0.7;
  min-width: 64px;
  text-align: center;
}
.talents {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.talents__cta {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
@media (max-width: 900px) {
  .gigs {
    grid-template-columns: repeat(2, 1fr);
  }
  .talents {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 560px) {
  .gigs,
  .talents {
    grid-template-columns: 1fr;
  }
}
/* ── Audience ─────────────────────────────────────────── */
.audience {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.aud__list {
  margin: 0 0 24px;
}

/* ── Categories ───────────────────────────────────────── */
.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 24px;
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 900px) {
  .trust {
    grid-template-columns: repeat(2, 1fr);
  }
  .features {
    grid-template-columns: 1fr;
  }
  .audience {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .trust {
    grid-template-columns: 1fr;
  }
}
</style>
