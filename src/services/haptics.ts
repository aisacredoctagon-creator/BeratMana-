/** Getaran haptic (hanya bila perangkat mendukung dan pengguna sudah berinteraksi). */
const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function' &&
  (navigator.userActivation?.hasBeenActive ?? true);

export const haptics = {
  correct: (): void => void (canVibrate() && navigator.vibrate(14)),
  wrong: (): void => void (canVibrate() && navigator.vibrate([45, 35, 70])),
  combo: (): void => void (canVibrate() && navigator.vibrate([18, 30, 18, 30, 40])),
  gameOver: (): void => void (canVibrate() && navigator.vibrate(220)),
};
