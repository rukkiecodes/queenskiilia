import { useMutation } from '@tanstack/vue-query'
import { profileApi } from '~/lib/profile-api'
import { fileToBase64 } from '~/lib/cloudinary'
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

/** Upload an avatar via the gateway's base64 mutation (small images). */
export function useUploadAvatar() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: async (file: File | Blob) => {
      const { base64, mimeType } = await fileToBase64(file)
      return profileApi.uploadAvatar(base64, mimeType)
    },
    onSuccess: (me) => {
      auth.me = me
    },
  })
}
