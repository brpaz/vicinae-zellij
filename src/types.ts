export type TerminalApp = 'alacritty' | 'ghostty' | 'gnome-terminal';

export interface ZellijSession {
  name: string;
  createdAt: number;
  active: boolean;
}

export interface ZellijLayout {
  name: string;
  path: string;
}

export interface Preferences {
  terminalApp: TerminalApp;
}
