// src/hooks/useRateLimit.ts

import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';

interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  remainingAttempts: number;
}

export const useRateLimit = (maxAttempts: number = 5, cooldownSeconds: number = 60) => {
  const [state, setState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: 0,
    remainingAttempts: maxAttempts,
  });

  const [attempts, setAttempts] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);

  const resetCooldown = useCallback(() => {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      setCooldownTimer(null);
    }
    setState({
      isRateLimited: false,
      retryAfter: 0,
      remainingAttempts: maxAttempts,
    });
    setAttempts(0);
  }, [cooldownTimer, maxAttempts]);

  const handleAttempt = useCallback(async (action: () => Promise<any>) => {
    if (state.isRateLimited) {
      Swal.fire({
        icon: 'warning',
        title: 'Rate Limited',
        text: `Please wait ${state.retryAfter} seconds before trying again.`,
        timer: state.retryAfter * 1000,
        timerProgressBar: true,
      });
      throw new Error('Rate limited');
    }

    try {
      const result = await action();
      // Reset attempts on success
      if (attempts > 0) {
        resetCooldown();
      }
      return result;
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error?.status === 429 || error?.response?.status === 429) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        const remaining = maxAttempts - newAttempts;
        const retryAfter = error?.retry_after || error?.response?.data?.retry_after || cooldownSeconds;

        if (remaining <= 0 || newAttempts >= maxAttempts) {
          // Start cooldown
          setState({
            isRateLimited: true,
            retryAfter: retryAfter,
            remainingAttempts: 0,
          });

          // Auto reset after cooldown
          const timer = setTimeout(() => {
            resetCooldown();
          }, retryAfter * 1000);
          setCooldownTimer(timer);

          Swal.fire({
            icon: 'warning',
            title: 'Too Many Attempts',
            text: `You have been rate limited. Please wait ${retryAfter} seconds before trying again.`,
            timer: retryAfter * 1000,
            timerProgressBar: true,
          });
        } else {
          setState({
            isRateLimited: false,
            retryAfter: retryAfter,
            remainingAttempts: remaining,
          });

          Swal.fire({
            icon: 'warning',
            title: 'Warning',
            text: `${remaining} attempts remaining. Please wait ${retryAfter} seconds before trying again.`,
            timer: 3000,
            timerProgressBar: true,
          });
        }
      }
      throw error;
    }
  }, [state.isRateLimited, state.retryAfter, attempts, maxAttempts, cooldownSeconds, resetCooldown]);

  return {
    ...state,
    handleAttempt,
    resetCooldown,
  };
};
