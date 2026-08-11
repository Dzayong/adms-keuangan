export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PAID', 'FAILED', 'EXPIRED'],
  PAID: [],
  FAILED: [],
  EXPIRED: [],
};

/**
 * Validates whether a transition from one payment state to another is allowed.
 * @param currentStatus The current status of the payment/transaction.
 * @param targetStatus The desired new status.
 * @returns boolean True if the transition is valid, otherwise false.
 */
export function validateStateTransition(currentStatus: string, targetStatus: string): boolean {
  // If the current status is not a recognized state, it's invalid.
  if (!(currentStatus in VALID_TRANSITIONS)) {
    return false;
  }

  // Idempotency: same status is allowed
  if (currentStatus === targetStatus) {
    return true;
  }

  const allowedNextStates = VALID_TRANSITIONS[currentStatus as PaymentStatus];
  return allowedNextStates.includes(targetStatus as PaymentStatus);
}

/**
 * Returns a user-friendly error message for invalid transitions.
 */
export function getInvalidTransitionMessage(currentStatus: string, targetStatus: string): string {
  return `Transisi status tidak valid: tidak dapat mengubah status dari '${currentStatus}' menjadi '${targetStatus}'.`;
}
