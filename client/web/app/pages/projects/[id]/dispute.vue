<script setup lang="ts">
import { format } from 'date-fns'
import FileUpload from '~/components/forms/file-upload.vue'
import { useProjectDispute, useRaiseDispute } from '~/composables/use-ratings-disputes'

definePageMeta({ layout: 'app' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: existing, suspense } = useProjectDispute(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate, isPending } = useRaiseDispute()
const reason = ref('')
const evidence = ref<string[]>([])
const error = ref('')

function submit() {
  if (reason.value.trim().length < 10) {
    error.value = 'Please describe the issue (at least 10 characters).'
    return
  }
  error.value = ''
  mutate(
    { projectId: id.value, reason: reason.value.trim(), evidence: evidence.value.length ? evidence.value : undefined },
    {
      onSuccess: () => navigateTo('/disputes'),
      onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Could not raise the dispute.'),
    },
  )
}
</script>

<template>
  <div class="disp">
    <button type="button" class="disp__back" @click="navigateTo(`/projects/${id}`)">
      <f-icon icon="arrow-left" /> Project
    </button>
    <h1 class="disp__title">Raise a dispute</h1>

    <template v-if="existing">
      <f-alert type="warning" variant="flat">
        A dispute is already open for this project (status: {{ statusLabel(existing.status) }}).
      </f-alert>
      <p class="disp__reason">“{{ existing.reason }}”</p>
      <f-btn color="primary" @click="navigateTo('/disputes')">View my disputes</f-btn>
    </template>

    <template v-else>
      <f-alert type="info" variant="flat">
        Raising a dispute freezes the escrow until our team reviews it. Use this only if you
        can't resolve the issue directly.
      </f-alert>
      <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

      <f-textarea v-model="reason" label="What's the problem?" :rows="4" placeholder="Describe the issue clearly…" />
      <div>
        <p class="disp__label">Evidence (optional)</p>
        <FileUpload v-model="evidence" folder="disputes" :max-size-mb="8" />
      </div>

      <f-btn color="danger" block size="large" :loading="isPending" @click="submit">
        Submit dispute
      </f-btn>
    </template>
  </div>
</template>

<style scoped>
.disp {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.disp__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  cursor: pointer;
  font: inherit;
  padding: 0;
  align-self: flex-start;
}
.disp__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.disp__reason {
  margin: 0;
  font-style: italic;
  opacity: 0.8;
}
.disp__label {
  margin: 0 0 6px;
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
