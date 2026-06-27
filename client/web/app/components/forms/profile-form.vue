<script setup lang="ts">
import { SKILL_LEVELS } from '~/types/filters'
import { useAuthStore } from '~/stores/auth'
import {
  useUpdateBusinessProfile,
  useUpdateProfile,
  useUpdateStudentProfile,
} from '~/composables/use-profile-mutations'
import AvatarPicker from '~/components/forms/avatar-picker.vue'
import CountryField from '~/components/forms/country-field.vue'
import UniversityField from '~/components/forms/university-field.vue'
import IndustryField from '~/components/forms/industry-field.vue'
import SkillSelector from '~/components/forms/skill-selector.vue'
import type { Me } from '~/types/profile'

const props = defineProps<{ me: Me | null; submitLabel?: string; stepped?: boolean }>()
const emit = defineEmits<{ saved: [] }>()

const auth = useAuthStore()

const form = reactive({
  fullName: props.me?.fullName ?? '',
  country: props.me?.country ?? props.me?.businessProfile?.country ?? null,
  bio: props.me?.studentProfile?.bio ?? '',
  university: props.me?.studentProfile?.university ?? '',
  skillLevel: props.me?.studentProfile?.skillLevel ?? null,
  skills: [...(props.me?.studentProfile?.skills ?? [])],
  portfolioUrl: props.me?.studentProfile?.portfolioUrl ?? '',
  companyName: props.me?.businessProfile?.companyName ?? '',
  website: props.me?.businessProfile?.website ?? '',
  industry: props.me?.businessProfile?.industry ?? '',
  description: props.me?.businessProfile?.description ?? '',
})
const gradYear = ref(props.me?.studentProfile?.graduationYear?.toString() ?? '')

const { mutateAsync: saveProfile } = useUpdateProfile()
const { mutateAsync: saveStudent } = useUpdateStudentProfile()
const { mutateAsync: saveBusiness } = useUpdateBusinessProfile()

const saving = ref(false)
const error = ref('')

// ── Steps ──────────────────────────────────────────────────────────────────
const studentSteps = [
  { key: 'details', title: 'Your details' },
  { key: 'education', title: 'Education' },
  { key: 'skills', title: 'Skills' },
]
const businessSteps = [
  { key: 'details', title: 'Your details' },
  { key: 'company', title: 'Your company' },
]
const steps = computed(() => (auth.isStudent ? studentSteps : businessSteps))
const step = ref(0)
const isLast = computed(() => step.value === steps.value.length - 1)
const primaryLabel = computed(() => {
  if (!props.stepped || isLast.value) return props.submitLabel ?? 'Save profile'
  return 'Continue'
})

/** Whether a section is shown in the current view. */
function showSection(key: string): boolean {
  return !props.stepped || steps.value[step.value]?.key === key
}

function validateStep(): boolean {
  const key = steps.value[step.value]?.key
  if (key === 'details' && (!form.fullName.trim() || !form.country)) {
    error.value = 'Your name and country are required.'
    return false
  }
  error.value = ''
  return true
}

function back(): void {
  if (step.value > 0) step.value--
  error.value = ''
}

function onPrimary(): void {
  if (props.stepped && !isLast.value) {
    if (validateStep()) step.value++
    return
  }
  submit()
}

function clean(v: string | null | undefined): string | undefined {
  const t = (v ?? '').trim()
  return t ? t : undefined
}

async function submit() {
  error.value = ''
  if (!form.fullName.trim() || !form.country) {
    if (props.stepped) step.value = 0
    error.value = 'Your name and country are required.'
    return
  }
  if (auth.isBusiness && !form.companyName.trim()) {
    if (props.stepped) step.value = steps.value.findIndex((s) => s.key === 'company')
    error.value = 'Company name is required.'
    return
  }
  saving.value = true
  try {
    await saveProfile({ fullName: form.fullName.trim(), country: form.country })
    if (auth.isStudent) {
      await saveStudent({
        bio: clean(form.bio),
        university: clean(form.university),
        graduationYear: gradYear.value ? Number(gradYear.value) : undefined,
        skills: form.skills,
        skillLevel: form.skillLevel ?? undefined,
        portfolioUrl: clean(form.portfolioUrl),
      })
    } else {
      await saveBusiness({
        companyName: form.companyName.trim(),
        website: clean(form.website),
        industry: clean(form.industry),
        country: form.country,
        description: clean(form.description),
      })
    }
    await auth.fetchMe()
    emit('saved')
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Could not save your profile. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="pform" @submit.prevent="onPrimary">
    <!-- Step progress -->
    <div v-if="stepped" class="pform__progress">
      <div class="pform__bar">
        <span
          v-for="(s, i) in steps"
          :key="s.key"
          class="pform__seg"
          :class="{ 'pform__seg--on': i <= step }"
        />
      </div>
      <span class="pform__step-label">
        Step {{ step + 1 }} of {{ steps.length }} · {{ steps[step].title }}
      </span>
    </div>

    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <!-- Details (both roles) -->
    <section v-show="showSection('details')" class="pform__section">
      <h2 v-if="!stepped" class="pform__legend">Basics</h2>
      <div class="pform__avatar"><AvatarPicker /></div>
      <div class="pform__grid">
        <f-input v-model="form.fullName" label="Full name" placeholder="Your name" prepend-icon="user" />
        <CountryField v-model="form.country" />
      </div>
    </section>

    <!-- Education (students) -->
    <section v-show="auth.isStudent && showSection('education')" class="pform__section">
      <h2 v-if="!stepped" class="pform__legend">Education &amp; about</h2>
      <div class="pform__grid">
        <UniversityField v-model="form.university" />
        <f-input v-model="gradYear" type="number" label="Graduation year" placeholder="2026" />
        <f-select v-model="form.skillLevel" :items="SKILL_LEVELS" label="Skill level" clearable />
        <f-input v-model="form.portfolioUrl" label="Portfolio URL" placeholder="https://" prepend-icon="link" />
      </div>
      <f-textarea v-model="form.bio" label="Bio" placeholder="A short intro about you and what you do" :rows="3" />
    </section>

    <!-- Skills (students) -->
    <section v-show="auth.isStudent && showSection('skills')" class="pform__section">
      <h2 v-if="!stepped" class="pform__legend">Skills</h2>
      <SkillSelector v-model="form.skills" />
    </section>

    <!-- Company (business) -->
    <section v-show="auth.isBusiness && showSection('company')" class="pform__section">
      <h2 v-if="!stepped" class="pform__legend">Your company</h2>
      <div class="pform__grid">
        <f-input v-model="form.companyName" label="Company name" prepend-icon="briefcase" />
        <f-input v-model="form.website" label="Website" placeholder="https://" prepend-icon="link" />
        <IndustryField v-model="form.industry" />
      </div>
      <f-textarea v-model="form.description" label="Description" placeholder="What your company does" :rows="3" />
    </section>

    <!-- Nav -->
    <div class="pform__nav">
      <f-btn v-if="stepped && step > 0" variant="text" type="button" @click="back">Back</f-btn>
      <f-spacer />
      <f-btn
        color="primary"
        size="large"
        :block="!stepped"
        type="submit"
        :loading="saving"
      >
        {{ primaryLabel }}
      </f-btn>
    </div>
  </form>
</template>

<style scoped>
.pform {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.pform__progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pform__bar {
  display: flex;
  gap: 6px;
}
.pform__seg {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: rgba(var(--fui-theme-on-background), 0.12);
  transition: background 0.2s ease;
}
.pform__seg--on {
  background: rgb(var(--fui-theme-primary));
}
.pform__step-label {
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.6;
}
.pform__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pform__legend {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.pform__avatar {
  display: flex;
  justify-content: flex-start;
}
.pform__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
}
.pform__nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}
@media (max-width: 560px) {
  .pform__grid {
    grid-template-columns: 1fr;
  }
}
</style>
