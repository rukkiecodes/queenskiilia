<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import StudentDashboard from '~/components/dashboard/student-dashboard.vue'
import BusinessDashboard from '~/components/dashboard/business-dashboard.vue'

definePageMeta({ layout: 'app' })

const auth = useAuthStore()
</script>

<template>
  <BusinessDashboard v-if="auth.isBusiness" />
  <StudentDashboard v-else />
</template>
