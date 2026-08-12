import type { WatcherState } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchWatcherState(): Promise<WatcherState> {
  const response = await fetch(`${API_BASE}/api/watcher-state`);
  if (!response.ok) {
    throw new Error(`Watcher API responded with ${response.status}`);
  }
  return response.json();
}
