export type TerminalApp = 'alacritty' | 'ghostty' | 'gnome-terminal';

export interface ZellijSession {
  name: string;
  createdAt: number;
  isAttached: boolean;
  tabCount?: number;
  paneCount?: number;
}

export interface ZellijLayout {
  name: string;
  path: string;
}

export interface Preferences {
  terminalApp: TerminalApp;
}
