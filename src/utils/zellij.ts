import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ZellijLayout, ZellijSession } from '../types';

const execAsync = promisify(execFile);

/**
 * Get list of active Zellij sessions
 */
export async function getZellijSessions(): Promise<ZellijSession[]> {
  try {
    const { stdout } = await execAsync('zellij', ['list-sessions', '-n']);
    const lines = stdout.trim().split('\n');

    const sessions: ZellijSession[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const match = line.match(/^(\S+)\s+\[Created .+? ago\]\s*(.*)$/);
      if (!match) continue;

      const [, name, suffix] = match;

      sessions.push({
        name,
        createdAt: Date.now(),
        active: !suffix.includes('EXITED'),
      });
    }

    return sessions;
  } catch (error) {
    // If no sessions exist, zellij returns exit code 1
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: number }).code === 1
    ) {
      return [];
    }
    throw error;
  }
}

/**
 * Get list of available Zellij layouts
 */
export async function getZellijLayouts(): Promise<ZellijLayout[]> {
  const layouts: ZellijLayout[] = [];

  // Check common layout directories
  const layoutDirs = [
    join(homedir(), '.config', 'zellij', 'layouts'),
    join('/etc', 'zellij', 'layouts'),
  ];

  for (const dir of layoutDirs) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (file.endsWith('.kdl') || file.endsWith('.yaml')) {
          const name = file.replace(/\.(kdl|yaml)$/, '');
          layouts.push({
            name,
            path: join(dir, file),
          });
        }
      }
    } catch {}
  }

  return layouts;
}

/**
 * Check if Zellij is installed
 */
export async function isZellijInstalled(): Promise<boolean> {
  try {
    await execAsync('which', ['zellij']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a shell command in a new pane of a running session, without attaching to it
 */
export async function runCommandInSession(
  session: string,
  command: string
): Promise<void> {
  await execAsync('zellij', [
    '--session',
    session,
    'run',
    '--',
    'sh',
    '-c',
    command,
  ]);
}

/**
 * Open a new tab in a running session, without attaching to it
 */
export async function newTabInSession(
  session: string,
  tabName?: string
): Promise<void> {
  const args = ['--session', session, 'action', 'new-tab'];
  if (tabName) {
    args.push('--name', tabName);
  }
  await execAsync('zellij', args);
}

/**
 * Replace a running session's entire layout (all tabs and panes) with the
 * given layout file, without attaching to it
 */
export async function applyLayoutToSession(
  session: string,
  layoutPath: string
): Promise<void> {
  await execAsync('zellij', [
    '--session',
    session,
    'action',
    'override-layout',
    layoutPath,
  ]);
}

/**
 * Rename a running session, without attaching to it
 */
export async function renameSession(
  session: string,
  newName: string
): Promise<void> {
  await execAsync('zellij', [
    '--session',
    session,
    'action',
    'rename-session',
    newName,
  ]);
}
