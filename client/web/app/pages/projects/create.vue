<script setup lang="ts">
import { z } from 'zod'
import FileUpload from '~/components/forms/file-upload.vue'
import SkillSelector from '~/components/forms/skill-selector.vue'
import { SKILL_LEVELS, type SkillLevel } from '~/types/filters'
import { useCreateProject } from '~/composables/use-project-mutations'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const form = reactive({
  title: '',
  description: '',
  requiredSkills: [] as string[],
  skillLevel: null as SkillLevel | null,
  budget: '',
  currency: 'USD',
  durationDays: '',
  thumbnail: [] as string[],
})
const error = ref('')
const { mutate, isPending } = useCreateProject()

const schema = z.object({
  title: z.string().trim().min(3, 'Give your project a clear title'),
  description: z.string().trim().min(10, 'Add a bit more detail to the description'),
  budget: z.coerce.number().positive('Budget must be greater than zero'),
  durationDays: z.coerce.number().int().positive('Set how many days the talent has to deliver'),
})

function submit() {
  const parsed = schema.safeParse({
    title: form.title,
    description: form.description,
    budget: form.budget,
    durationDays: form.durationDays,
  })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Please check the form'
    return
  }
  if (!form.requiredSkills.length) return (error.value = 'Add at least one required skill')
  if (!form.skillLevel) return (error.value = 'Select a required skill level')
  error.value = ''

  mutate(
    {
      title: parsed.data.title,
      description: parsed.data.description,
      requiredSkills: form.requiredSkills,
      skillLevel: form.skillLevel,
      budget: parsed.data.budget,
      currency: form.currency,
      thumbnailUrl: form.thumbnail[0] || undefined,
      durationDays: parsed.data.durationDays,
    },
    {
      onSuccess: (project) => navigateTo(`/projects/${project.id}`),
      onError: (e: unknown) => {
        error.value = (e as Error)?.message ?? 'Could not create the project.'
      },
    },
  )
}
</script>

<template>
  <div class="create">
    <header class="create__head">
      <h1 class="create__title">Post a project</h1>
      <p class="create__sub">
        Tell us what you need done — it takes about a minute, and talent can start applying right away.
      </p>
    </header>

    <f-alert v-if="error" type="error" variant="flat" class="create__alert">{{ error }}</f-alert>

    <form class="create__form" @submit.prevent="submit">
      <section class="create__section">
        <h2 class="create__legend">The basics</h2>
        <div class="create__thumb">
          <span class="create__thumb-label">Project thumbnail (optional)</span>
          <FileUpload v-model="form.thumbnail" folder="project-thumbnails" :max-size-mb="5" />
          <span class="create__thumb-hint">A cover image for your listing. We'll use a default if you skip it.</span>
        </div>
        <f-input
          v-model="form.title"
          label="Project title"
          placeholder="e.g. Build a responsive landing page"
          hint="A short, clear title — it's the first thing talent sees."
          persistent-hint
        />
        <f-textarea
          v-model="form.description"
          label="What needs doing?"
          :rows="5"
          placeholder="List the deliverables, the must-haves, and anything that helps talent nail it."
        />
      </section>

      <section class="create__section">
        <h2 class="create__legend">Who you're looking for</h2>
        <SkillSelector v-model="form.requiredSkills" />
        <f-select
          v-model="form.skillLevel"
          :items="[...SKILL_LEVELS]"
          label="Required skill level"
          placeholder="Any level"
          clearable
        />
      </section>

      <section class="create__section">
        <h2 class="create__legend">Budget &amp; timeline</h2>
        <f-input
          v-model="form.budget"
          type="number"
          label="Budget (USD)"
          placeholder="500"
          prepend-icon="dollar-sign"
          hint="Set in US dollars — the platform's single currency."
        />
        <f-input
          v-model="form.durationDays"
          type="number"
          label="Delivery time (days)"
          placeholder="e.g. 14"
          hint="How many days the talent has to deliver. The countdown starts the moment they're selected — not today."
          persistent-hint
        />
      </section>

      <f-btn color="primary" block size="large" type="submit" :loading="isPending">
        Publish project
      </f-btn>
    </form>
  </div>
</template>

<style scoped>
.create {
  max-width: 640px;
  margin: 0 auto;
}
.create__thumb {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.create__thumb-label {
  font-size: 0.85rem;
  font-weight: 600;
}
.create__thumb-hint {
  font-size: 0.78rem;
  opacity: 0.6;
}
.create__head {
  margin-bottom: 28px;
}
.create__title {
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
.create__sub {
  margin: 0;
  opacity: 0.65;
  max-width: 48ch;
}
.create__alert {
  margin-bottom: 16px;
}
.create__form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.create__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.create__legend {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.create__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
</style>
