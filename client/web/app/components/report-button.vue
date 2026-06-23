<script setup lang="ts">
import ReportDialog from '~/components/report-dialog.vue'
import type { ReportTargetType } from '~/types/report'

defineProps<{ targetType: ReportTargetType; targetId: string; label?: string }>()
const open = ref(false)
</script>

<template>
  <span>
    <f-btn variant="text" size="small" prepend-icon="flag" @click="open = true">
      {{ label ?? 'Report' }}
    </f-btn>
    <ReportDialog v-model="open" :target-type="targetType" :target-id="targetId" />
  </span>
</template>
