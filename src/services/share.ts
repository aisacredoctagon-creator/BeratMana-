export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Web Share API; bila tidak tersedia, salin teks ke clipboard. */
export async function shareText(text: string, url: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Berat Mana?', text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // gagal karena alasan lain → coba salin
    }
  }
  const full = `${text} ${url}`;
  try {
    await navigator.clipboard.writeText(full);
    return 'copied';
  } catch {
    return legacyCopy(full) ? 'copied' : 'failed';
  }
}

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}
