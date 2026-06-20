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
import SkillSelector from '~/components/forms/skill-selector.vue'
import type { Me } from '~/types/profile'

const props = defineProps<{ me: Me | null; submitLabel?: string }>()
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

function clean(v: string): string | undefined {
  const t = v.trim()
  return t ? t : undefined
}

async function submit() {
  error.value = ''
  if (!form.fullName.trim() || !form.country) {
    error.value = 'Your name and country are required.'
    return
  }
  if (auth.isBusiness && !form.companyName.trim()) {
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
  <form class="pform" @submit.prevent="submit">
    <AvatarPicker />

    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <f-input v-model="form.fullName" label="Full name" placeholder="Your name" prepend-icon="user" />
    <CountryField v-model="form.country" />

    <template v-if="auth.isStudent">
      <f-textarea v-model="form.bio" label="Bio" placeholder="A short intro" :rows="3" />
      <f-input v-model="form.university" label="University" />
      <f-input v-model="gradYear" type="number" label="Graduation year" />
      <f-select v-model="form.skillLevel" :items="SKILL_LEVELS" label="Skill level" clearable />
      <SkillSelector v-model="form.skills" />
      <f-input v-model="form.portfolioUrl" label="Portfolio URL" placeholder="https://" prepend-icon="link" />
    </template>

    <template v-else>
      <f-input v-model="form.companyName" label="Company name" prepend-icon="briefcase" />
      <f-input v-model="form.website" label="Website" placeholder="https://" prepend-icon="link" />
      <f-input v-model="form.industry" label="Industry" />
      <f-textarea v-model="form.description" label="About the company" :rows="3" />
    </template>

    <f-btn color="primary" block type="submit" :loading="saving">
      {{ submitLabel ?? 'Save profile' }}
    </f-btn>
  </form>
</template>

<style scoped>
.pform {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
