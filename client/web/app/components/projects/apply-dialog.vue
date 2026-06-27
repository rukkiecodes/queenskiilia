<script setup lang="ts">
import { useApplyToProject } from '~/composables/use-project-mutations'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ projectId: string; projectTitle?: string }>()
const emit = defineEmits<{ applied: [] }>()

const coverNote = ref('')
const error = ref('')
const { mutate, isPending } = useApplyToProject()

function submit() {
  error.value = ''
  mutate(
    { projectId: props.projectId, coverNote: coverNote.value.trim() },
    {
      onSuccess: () => {
        open.value = false
        coverNote.value = ''
        emit('applied')
      },
      onError: (e: unknown) => {
        error.value = (e as Error)?.message ?? 'Could not submit your application.'
      },
    },
  )
}
</script>

<template>
  <f-dialog v-model="open" blur :width="480">
    <template #header>
      <h3 class="apply__title">Apply{{ projectTitle ? ` to ${projectTitle}` : '' }}</h3>
    </template>

    <f-alert v-if="error" type="error" variant="flat" class="apply__alert">{{ error }}</f-alert>
    <f-textarea
      v-model="coverNote"
      label="Cover note (optional)"
      placeholder="Tell the client why you're a great fit…"
      :rows="4"
    />

    <template #footer>
      <f-btn variant="text" @click="open = false">Cancel</f-btn>
      <f-btn color="primary" :loading="isPending" @click="submit">Submit application</f-btn>
    </template>
  </f-dialog>
</template>

<style scoped>
.apply__title {
  margin: 0;
  font-weight: 600;
}
.apply__alert {
  margin-bottom: 12px;
}
</style>
