import { COMBO_HAPTIC } from '../config/combo';

/** Getaran haptic (hanya bila perangkat mendukung dan pengguna sudah berinteraksi). */
const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function' &&
  (navigator.userActivation?.hasBeenActive ?? true);

export const haptics = {
  correct: (): void => void (canVibrate() && navigator.vibrate(14)),
  wrong: (): void => void (canVibrate() && navigator.vibrate([45, 35, 70])),
  /** Berjenjang menurut tingkat combo 1–5. */
  combo: (level = 2): void => {
    if (!canVibrate()) return;
    const i = Math.max(1, Math.min(COMBO_HAPTIC.length, Math.round(level))) - 1;
    navigator.vibrate([...(COMBO_HAPTIC[i] as readonly number[])]);
  },
  gameOver: (): void => void (canVibrate() && navigator.vibrate(220)),
};
