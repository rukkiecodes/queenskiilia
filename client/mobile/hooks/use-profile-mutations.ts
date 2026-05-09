import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  profileApi,
  type UpdateBusinessProfileInput,
  type UpdateProfileInput,
  type UpdateStudentProfileInput,
} from '@/lib/profile-api';

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useUpdateStudentProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateStudentProfileInput) =>
      profileApi.updateStudentProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useUpdateBusinessProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBusinessProfileInput) =>
      profileApi.updateBusinessProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
