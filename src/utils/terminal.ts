import { getPreferenceValues } from '@vicinae/api';
import type { Preferences, TerminalApp } from '../types';

/**
 * Get the terminal command to open Zellij
 */
export function getTerminalCommand(
  sessionOrLayout: string,
  isSession: boolean
): string[] {
  const preferences = getPreferenceValues<Preferences>();
  const terminalApp = preferences.terminalApp;

  const zellijArgs = isSession
    ? ['zellij', 'attach', sessionOrLayout]
    : ['zellij', '--layout', sessionOrLayout];

  switch (terminalApp) {
    case 'alacritty':
      return ['alacritty', '-e', ...zellijArgs];

    case 'ghostty':
      return ['ghostty', '-e', ...zellijArgs];

    case 'gnome-terminal':
      return ['gnome-terminal', '--', ...zellijArgs];

    default:
      // Fallback to alacritty
      return ['alacritty', '-e', ...zellijArgs];
  }
}

/**
 * Get the terminal app name for display
 */
export function getTerminalAppName(app: TerminalApp): string {
  switch (app) {
    case 'alacritty':
      return 'Alacritty';
    case 'ghostty':
      return 'Ghostty';
    case 'gnome-terminal':
      return 'GNOME Terminal';
    default:
      return 'Terminal';
  }
}
