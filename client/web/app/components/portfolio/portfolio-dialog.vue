<script setup lang="ts">
import { format } from 'date-fns'
import FileUpload from '~/components/forms/file-upload.vue'
import { portfolioApi } from '~/lib/portfolio-api'
import { useAuthStore } from '~/stores/auth'
import type { PortfolioItem } from '~/types/portfolio'

const props = defineProps<{
  item: PortfolioItem | null
  editable?: boolean
  talentName?: string
  talentAvatar?: string
}>()
const emit = defineEmits<{ updated: [PortfolioItem] }>()
const open = defineModel<boolean>({ default: false })

const auth = useAuthStore()

// Local working copy (so likes/media reflect immediately).
const local = ref<PortfolioItem | null>(null)

const completed = computed(() => {
  const v = local.value
  if (!v?.completedAt) return ''
  const d = new Date(Number.isNaN(Number(v.completedAt)) ? v.completedAt : Number(v.completedAt))
  return Number.isNaN(d.getTime()) ? '' : format(d, 'MMM yyyy')
})

const talent = computed(() => ({
  name: props.talentName || auth.me?.fullName || 'Talent',
  avatar: props.talentAvatar || auth.me?.avatarUrl || undefined,
  initial: (props.talentName || auth.me?.fullName || 'T').charAt(0).toUpperCase(),
}))

// ── Likes ────────────────────────────────────────────────────────────────────
const liking = ref(false)
async function toggleLike() {
  const v = local.value
  if (!v || liking.value) return
  if (!auth.isAuthenticated) return navigateTo('/login')
  liking.value = true
  const wasLiked = v.likedByMe
  // optimistic
  v.likedByMe = !wasLiked
  v.likeCount += wasLiked ? -1 : 1
  try {
    const updated = wasLiked ? await portfolioApi.unlike(v.id) : await portfolioApi.like(v.id)
    local.value = { ...updated }
    emit('updated', updated)
  } catch {
    v.likedByMe = wasLiked
    v.likeCount += wasLiked ? 1 : -1
  } finally {
    liking.value = false
  }
}

// ── Edit (owner) ──────────────────────────────────────────────────────────────
const editing = ref(false)
const saving = ref(false)
const form = reactive({ description: '', images: [] as string[], videoUrl: '', liveUrl: '' })
async function save() {
  const v = local.value
  if (!v) return
  saving.value = true
  try {
    const updated = await portfolioApi.update(v.id, {
      description: form.description.trim() || undefined,
      imageUrls: form.images,
      videoUrl: form.videoUrl.trim(),
      liveUrl: form.liveUrl.trim(),
    })
    local.value = { ...updated }
    editing.value = false
    emit('updated', updated)
  } finally {
    saving.value = false
  }
}

// ── Share ─────────────────────────────────────────────────────────────────────
const showShare = ref(false)
const shareUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return local.value ? `${origin}/talent/${local.value.studentId}` : origin
})
const shareText = computed(() =>
  local.value
    ? `Check out "${local.value.projectTitle}" — a project I delivered for ${local.value.businessName} on QueenSkiilia.`
    : '',
)
const shareTargets = computed(() => {
  const u = encodeURIComponent(shareUrl.value)
  const t = encodeURIComponent(shareText.value)
  return [
    { key: 'x', label: 'X', icon: 'twitter', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'facebook', label: 'Facebook', icon: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'message-circle', href: `https://wa.me/?text=${t}%20${u}` },
  ]
})
const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${shareText.value} ${shareUrl.value}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    /* clipboard blocked */
  }
}

// Sync local copy + seed the edit form whenever the selected item changes.
// (Declared after editing/form/showShare so immediate run doesn't hit the TDZ.)
watch(
  () => props.item,
  (v) => {
    local.value = v ? { ...v } : null
    if (v) {
      form.description = v.description ?? ''
      form.images = [...(v.imageUrls ?? [])]
      form.videoUrl = v.videoUrl ?? ''
      form.liveUrl = v.liveUrl ?? ''
    }
    editing.value = false
    showShare.value = false
  },
  { immediate: true },
)

const cover = computed(
  () =>
    local.value?.imageUrls?.[0] ??
    (local.value?.fileUrls ?? []).find((u) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(u)) ??
    null,
)
function openUrl(url: string | null) {
  if (url && typeof window !== 'undefined') window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <f-dialog v-model="open" blur :width="640">
    <div v-if="local" class="pd-b">
      <!-- Hero cover -->
      <div class="pd-hero">
        <img v-if="cover" :src="cover" :alt="local.projectTitle" />
        <div v-else class="pd-hero__ph"><span>{{ talent.initial }}</span></div>
      </div>

      <!-- Extra image thumbnails -->
      <div v-if="local.imageUrls.length > 1" class="pd-thumbs">
        <img v-for="(img, i) in local.imageUrls" :key="i" :src="img" :alt="local.projectTitle" />
      </div>

      <!-- Title + like -->
      <div class="pd-title-row">
        <div class="pd-title-text">
          <h3 class="pd-title">{{ local.projectTitle }}</h3>
          <p class="pd-sub">{{ local.businessName }}<span v-if="completed"> · {{ completed }}</span></p>
        </div>
        <button
          type="button"
          class="pd-like"
          :class="{ 'pd-like--on': local.likedByMe }"
          :disabled="liking"
          @click="toggleLike"
        >
          <f-icon icon="heart" /> {{ local.likeCount }}
        </button>
      </div>

      <!-- Live / video -->
      <div v-if="local.liveUrl || local.videoUrl" class="pd-cta">
        <f-btn v-if="local.liveUrl" color="primary" size="small" prepend-icon="external-link" @click="openUrl(local.liveUrl)">
          View live
        </f-btn>
        <f-btn v-if="local.videoUrl" variant="outlined" size="small" prepend-icon="play" @click="openUrl(local.videoUrl)">
          Watch video
        </f-btn>
      </div>

      <p v-if="local.description" class="pd-desc">{{ local.description }}</p>

      <div v-if="local.skills.length" class="pd-skills">
        <f-chip v-for="s in local.skills" :key="s">{{ s }}</f-chip>
      </div>

      <div v-if="local.clientRating != null" class="pd-review">
        <span class="pd-review__stars">★ {{ local.clientRating.toFixed(1) }}</span>
        <p v-if="local.clientReview" class="pd-review__text">"{{ local.clientReview }}"</p>
      </div>

      <!-- Owner: manage media -->
      <div v-if="editable" class="pd-edit">
        <f-btn v-if="!editing" variant="text" prepend-icon="edit-3" @click="editing = true">
          Add images, video &amp; live link
        </f-btn>
        <div v-else class="pd-edit__form">
          <span class="pd-legend">Images</span>
          <FileUpload v-model="form.images" folder="portfolio" :max-size-mb="5" />
          <f-input v-model="form.videoUrl" label="Video link" placeholder="YouTube, Vimeo or hosted video URL" prepend-icon="play" />
          <f-input v-model="form.liveUrl" label="Live project link" placeholder="https://" prepend-icon="link" />
          <f-textarea v-model="form.description" label="Description" :rows="3" />
          <div class="pd-edit__nav">
            <f-btn variant="text" @click="editing = false">Cancel</f-btn>
            <f-spacer />
            <f-btn color="primary" :loading="saving" @click="save">Save</f-btn>
          </div>
        </div>
      </div>

      <!-- Share -->
      <div class="pd-share">
        <f-btn variant="outlined" block prepend-icon="share-2" @click="showShare = !showShare">
          Share this project
        </f-btn>
        <div v-if="showShare" class="pd-share__panel">
          <!-- Type 12 social card preview = what your audience sees -->
          <f-card type="12" class="pd-sharecard">
            <template #avatar><f-avatar :image="talent.avatar" :text="talent.initial" :size="40" circle /></template>
            <template #header>
              <strong>{{ talent.name }}</strong>
              <span class="pd-sharecard__sub">delivered a project on QueenSkiilia</span>
            </template>
            <template #img><img v-if="cover" :src="cover" :alt="local.projectTitle" /></template>
            <template #text>
              <strong>{{ local.projectTitle }}</strong>
              <span class="pd-sharecard__biz"> · {{ local.businessName }}</span>
            </template>
          </f-card>

          <div class="pd-share__btns">
            <a
              v-for="s in shareTargets"
              :key="s.key"
              :href="s.href"
              target="_blank"
              rel="noopener noreferrer"
              class="pd-share__btn"
            >
              <f-icon :icon="s.icon" /> {{ s.label }}
            </a>
            <button type="button" class="pd-share__btn" @click="copyLink">
              <f-icon icon="link" /> {{ copied ? 'Copied!' : 'Copy link' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <f-btn color="primary" @click="open = false">Done</f-btn>
    </template>
  </f-dialog>
</template>

<style scoped>
.pd-b {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pd-hero {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(var(--fui-theme-on-background), 0.05);
}
.pd-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pd-hero__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgb(var(--fui-theme-primary)), rgba(var(--fui-theme-primary), 0.55));
  color: #fff;
}
.pd-hero__ph span {
  font-size: 3rem;
  font-weight: 800;
}
.pd-thumbs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.pd-thumbs img {
  width: 88px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  flex: 0 0 auto;
}
.pd-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pd-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.pd-sub {
  margin: 3px 0 0;
  opacity: 0.6;
  font-size: 0.88rem;
}
.pd-cta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pd-like {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.15);
  background: transparent;
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  color: inherit;
  flex: 0 0 auto;
}
.pd-like--on {
  color: rgb(var(--fui-theme-danger));
  border-color: rgba(var(--fui-theme-danger), 0.4);
  background: rgba(var(--fui-theme-danger), 0.08);
}
.pd-desc {
  margin: 0;
  line-height: 1.6;
  opacity: 0.85;
  white-space: pre-wrap;
}
.pd-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pd-review {
  background: rgba(var(--fui-theme-on-background), 0.04);
  border-radius: 12px;
  padding: 12px 14px;
}
.pd-review__stars {
  font-weight: 700;
  color: #f5a623;
}
.pd-review__text {
  margin: 6px 0 0;
  opacity: 0.8;
  font-style: italic;
}
.pd-edit {
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  padding-top: 14px;
}
.pd-edit__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd-legend {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.pd-edit__nav {
  display: flex;
  align-items: center;
}
.pd-share {
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  padding-top: 14px;
}
.pd-share__panel {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd-sharecard {
  max-width: 360px;
}
.pd-sharecard__sub,
.pd-sharecard__biz {
  opacity: 0.6;
  font-weight: 400;
}
.pd-share__btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pd-share__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.15);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  color: inherit;
  background: transparent;
  cursor: pointer;
}
</style>
