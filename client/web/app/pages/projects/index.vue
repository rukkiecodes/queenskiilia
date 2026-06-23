<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import StudentMarketplace from '~/components/projects/student-marketplace.vue'
import BusinessProjects from '~/components/projects/business-projects.vue'

definePageMeta({ layout: 'app' })

const auth = useAuthStore()
</script>

<template>
  <BusinessProjects v-if="auth.isBusiness" />
  <StudentMarketplace v-else />
</template>
