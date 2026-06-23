import { useMutation } from '@tanstack/vue-query'
import { profileApi } from '~/lib/profile-api'
import { uploadToCloudinary } from '~/lib/cloudinary'
import { useAuthStore } from '~/stores/auth'
import type {
  UpdateBusinessProfileInput,
  UpdateProfileInput,
  UpdateStudentProfileInput,
} from '~/types/profile'

/** Update core User fields (fullName, country, avatarUrl). Returns full `me`. */
export function useUpdateProfile() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateProfile(input),
    onSuccess: (me) => {
      auth.me = me
    },
  })
}

export function useUpdateStudentProfile() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (input: UpdateStudentProfileInput) => profileApi.updateStudentProfile(input),
    onSuccess: () => auth.fetchMe(),
  })
}

export function useUpdateBusinessProfile() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (input: UpdateBusinessProfileInput) => profileApi.updateBusinessProfile(input),
    onSuccess: () => auth.fetchMe(),
  })
}

/**
 * Upload an avatar to Cloudinary (browser → Cloudinary), then persist the
 * resulting URL via updateProfile. Sending image bytes through the GraphQL
 * gateway as base64 exceeds its 1MB JSON body limit (HTTP 413) for normal
 * photos, so only the URL travels to /graphql.
 */
export function useUploadAvatar() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: async (file: File | Blob) => {
      const { secureUrl } = await uploadToCloudinary(file, { folder: 'avatars' })
      return profileApi.updateProfile({ avatarUrl: secureUrl })
    },
    onSuccess: (me) => {
      auth.me = me
    },
  })
}
