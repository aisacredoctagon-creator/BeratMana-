import { $ } from '../dom';

export type ScreenId = 'title' | 'game' | 'over';

const IDS: Record<ScreenId, string> = { title: 'screen-title', game: 'screen-game', over: 'screen-over' };

export function showScreen(id: ScreenId): void {
  for (const key of Object.keys(IDS) as ScreenId[]) {
    $(IDS[key]).hidden = key !== id;
  }
}

export function currentScreen(): ScreenId {
  return (Object.keys(IDS) as ScreenId[]).find((k) => !$(IDS[k]).hidden) ?? 'title';
}
