import type { AccountType, Me, UserVerification } from './profile-api';

export type VerificationType = 'id_document' | 'face' | 'business_doc' | 'phone';

export type VerificationStatus =
  | 'not-submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export type VerificationStep = {
  type: VerificationType;
  title: string;
  subtitle: string;
  icon: string; // SF Symbol name
  status: VerificationStatus;
  /** The latest verification of this type, if any (status reflects it). */
  latest: UserVerification | null;
};

const STUDENT_STEPS: Omit<VerificationStep, 'status' | 'latest'>[] = [
  {
    type: 'id_document',
    title: 'Government ID',
    subtitle: 'Upload your national ID, passport, or driver’s license.',
    icon: 'doc.text.fill',
  },
  {
    type: 'face',
    title: 'Face match',
    subtitle: 'A quick selfie to confirm you match your ID.',
    icon: 'person.crop.circle.fill',
  },
];

const BUSINESS_STEPS: Omit<VerificationStep, 'status' | 'latest'>[] = [
  {
    type: 'business_doc',
    title: 'Business registration',
    subtitle: 'Certificate of incorporation, business permit, or tax filing.',
    icon: 'building.2.fill',
  },
];

export function deriveSteps(me: Me): VerificationStep[] {
  const base = me.accountType === 'business' ? BUSINESS_STEPS : STUDENT_STEPS;

  // verifications come back ordered by submitted_at DESC, so the first match per
  // type is the latest submission.
  return base.map((step) => {
    const latest = me.verifications.find((v) => v.type === step.type) ?? null;
    return {
      ...step,
      latest,
      status: latest ? (latest.status as VerificationStatus) : 'not-submitted',
    };
  });
}

/** Convenience: are all required verifications approved? */
export function isFullyVerified(me: Me): boolean {
  return deriveSteps(me).every((s) => s.status === 'approved');
}

export function statusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'not-submitted':
      return 'Not started';
    case 'pending':
      return 'In review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
  }
}

/** Helper used by the stepper screen and route registration. */
export function isValidVerificationType(t: string): t is VerificationType {
  return t === 'id_document' || t === 'face' || t === 'business_doc' || t === 'phone';
}

/** Whether a step is tappable to (re)submit. Approved is locked. */
export function canSubmit(status: VerificationStatus): boolean {
  return status !== 'approved' && status !== 'pending';
}

// Suppress unused import warning when only types are used.
export type { AccountType };
