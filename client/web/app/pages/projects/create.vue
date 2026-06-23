<script setup lang="ts">
import { z } from 'zod'
import CurrencyPicker from '~/components/forms/currency-picker.vue'
import DateField from '~/components/forms/date-field.vue'
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
  currency: 'NGN',
  deadline: '',
})
const error = ref('')
const { mutate, isPending } = useCreateProject()

const schema = z.object({
  title: z.string().trim().min(3, 'Give your project a clear title'),
  description: z.string().trim().min(10, 'Add a longer description'),
  budget: z.coerce.number().positive('Budget must be greater than zero'),
})

const minDate = new Date().toISOString().slice(0, 10)

function submit() {
  const parsed = schema.safeParse({ title: form.title, description: form.description, budget: form.budget })
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Please check the form'
    return
  }
  if (!form.skillLevel) return (error.value = 'Select a required skill level')
  if (!form.requiredSkills.length) return (error.value = 'Add at least one required skill')
  if (!form.deadline) return (error.value = 'Set a deadline')
  error.value = ''

  mutate(
    {
      title: parsed.data.title,
      description: parsed.data.description,
      requiredSkills: form.requiredSkills,
      skillLevel: form.skillLevel,
      budget: parsed.data.budget,
      currency: form.currency,
      deadline: new Date(form.deadline).toISOString(),
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
    <h1 class="create__title">Post a project</h1>
    <f-alert v-if="error" type="error" variant="flat" class="create__alert">{{ error }}</f-alert>

    <form class="create__form" @submit.prevent="submit">
      <f-input v-model="form.title" label="Title" placeholder="e.g. Build a responsive landing page" />
      <f-textarea
        v-model="form.description"
        label="Description"
        :rows="5"
        placeholder="Describe the work, deliverables, and expectations"
      />
      <SkillSelector v-model="form.requiredSkills" />
      <f-select v-model="form.skillLevel" :items="[...SKILL_LEVELS]" label="Required skill level" clearable />
      <div class="create__row">
        <f-input v-model="form.budget" type="number" label="Budget" />
        <CurrencyPicker v-model="form.currency" />
      </div>
      <DateField v-model="form.deadline" label="Deadline" :min="minDate" />
      <f-btn color="primary" block type="submit" :loading="isPending">Publish project</f-btn>
    </form>
  </div>
</template>

<style scoped>
.create {
  max-width: 560px;
}
.create__title {
  margin: 0 0 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.create__alert {
  margin-bottom: 16px;
}
.create__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.create__row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}
</style>
