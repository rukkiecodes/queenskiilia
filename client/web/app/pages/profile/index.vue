<script setup lang="ts">
import { useMe } from '~/composables/use-me'

definePageMeta({ layout: 'app' })

const { me } = useMe()
const initial = computed(() => (me.value?.fullName ?? me.value?.email ?? 'U').charAt(0).toUpperCase())
</script>

<template>
  <div v-if="me" class="profile">
    <header class="profile__head">
      <f-avatar :image="me.avatarUrl ?? undefined" :text="initial" :size="72" circle />
      <div class="profile__id">
        <h1 class="profile__name">
          {{ me.fullName ?? 'Unnamed' }}
          <f-chip v-if="me.isVerified" color="success" class="profile__badge">Verified</f-chip>
        </h1>
        <p class="profile__meta">{{ me.email }}<template v-if="me.country"> · {{ me.country }}</template></p>
      </div>
      <f-spacer />
      <div class="profile__actions">
        <f-btn variant="outlined" color="primary" size="small" @click="navigateTo('/profile/edit')">Edit</f-btn>
        <f-btn variant="text" size="small" @click="navigateTo('/verification')">Verify</f-btn>
      </div>
    </header>

    <section v-if="me.accountType === 'student' && me.studentProfile" class="profile__card">
      <p v-if="me.studentProfile.bio" class="profile__bio">{{ me.studentProfile.bio }}</p>
      <dl class="profile__facts">
        <div v-if="me.studentProfile.university"><dt>University</dt><dd>{{ me.studentProfile.university }}</dd></div>
        <div v-if="me.studentProfile.skillLevel"><dt>Skill level</dt><dd>{{ me.studentProfile.skillLevel }}</dd></div>
        <div v-if="me.studentProfile.averageRating != null"><dt>Rating</dt><dd>{{ me.studentProfile.averageRating.toFixed(1) }} ★</dd></div>
        <div><dt>Earnings</dt><dd>{{ me.studentProfile.totalEarnings }}</dd></div>
      </dl>
      <div v-if="me.studentProfile.skills.length" class="profile__skills">
        <f-chip v-for="s in me.studentProfile.skills" :key="s">{{ s }}</f-chip>
      </div>
    </section>

    <section v-else-if="me.accountType === 'business' && me.businessProfile" class="profile__card">
      <p v-if="me.businessProfile.description" class="profile__bio">{{ me.businessProfile.description }}</p>
      <dl class="profile__facts">
        <div><dt>Company</dt><dd>{{ me.businessProfile.companyName }}</dd></div>
        <div v-if="me.businessProfile.industry"><dt>Industry</dt><dd>{{ me.businessProfile.industry }}</dd></div>
        <div v-if="me.businessProfile.website"><dt>Website</dt><dd><a :href="me.businessProfile.website" target="_blank" rel="noopener">{{ me.businessProfile.website }}</a></dd></div>
        <div><dt>Projects posted</dt><dd>{{ me.businessProfile.totalProjectsPosted }}</dd></div>
      </dl>
    </section>
  </div>

  <div v-else class="profile__loading">Loading your profile…</div>
</template>

<style scoped>
.profile {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.profile__head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.profile__name {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}
.profile__meta {
  margin: 4px 0 0;
  opacity: 0.7;
}
.profile__actions {
  display: flex;
  gap: 8px;
}
.profile__card {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: var(--fui-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.profile__bio {
  margin: 0;
}
.profile__facts {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}
.profile__facts dt {
  font-size: 0.75rem;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.profile__facts dd {
  margin: 2px 0 0;
  font-weight: 600;
}
.profile__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.profile__loading {
  opacity: 0.6;
}
</style>
