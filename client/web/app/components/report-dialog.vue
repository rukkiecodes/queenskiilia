<script setup lang="ts">
import { REPORT_REASON_LABELS, type ReportReason, type ReportTargetType } from '~/types/report'
import { useSubmitReport } from '~/composables/use-ratings-disputes'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ targetType: ReportTargetType; targetId: string }>()

const reason = ref<ReportReason>('spam')
const details = ref('')
const done = ref(false)
const error = ref('')
const { mutate, isPending } = useSubmitReport()

const reasonItems = (Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((value) => ({
  value,
  title: REPORT_REASON_LABELS[value],
}))

function submit() {
  error.value = ''
  mutate(
    {
      targetType: props.targetType,
      targetId: props.targetId,
      reason: reason.value,
      details: details.value.trim() || undefined,
    },
    {
      onSuccess: () => (done.value = true),
      onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Could not submit the report.'),
    },
  )
}
</script>

<template>
  <f-dialog v-model="open" :width="440">
    <template #header><h3 class="rd__title">Report {{ targetType }}</h3></template>

    <template v-if="done">
      <f-alert type="success" variant="flat">Thanks — our team will review this report.</f-alert>
    </template>
    <template v-else>
      <f-alert v-if="error" type="error" variant="flat" class="rd__alert">{{ error }}</f-alert>
      <f-select v-model="reason" :items="reasonItems" item-title="title" item-value="value" label="Reason" />
      <f-textarea v-model="details" label="Details (optional)" :rows="3" placeholder="Add any context…" />
    </template>

    <template #footer>
      <f-btn variant="text" @click="open = false">{{ done ? 'Close' : 'Cancel' }}</f-btn>
      <f-btn v-if="!done" color="primary" :loading="isPending" @click="submit">Submit report</f-btn>
    </template>
  </f-dialog>
</template>

<style scoped>
.rd__title {
  margin: 0;
  font-weight: 600;
  text-transform: capitalize;
}
.rd__alert {
  margin-bottom: 12px;
}
</style>
