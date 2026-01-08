import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ZellijLayout, ZellijSession } from '../types';

const execAsync = promisify(exec);

/**
 * Get list of active Zellij sessions
 */
export async function getZellijSessions(): Promise<ZellijSession[]> {
  try {
    const { stdout } = await execAsync('zellij list-sessions -s');
    const lines = stdout.trim().split('\n');

    const sessions: ZellijSession[] = [];

    for (const line of lines) {
      const name = line.trim();
      if (!name) continue;

      sessions.push({
        name,
        createdAt: Date.now(),
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
    } catch {
      // Directory doesn't exist or is not readable, continue
      continue;
    }
  }

  return layouts;
}

/**
 * Check if Zellij is installed
 */
export async function isZellijInstalled(): Promise<boolean> {
  try {
    await execAsync('which zellij');
    return true;
  } catch {
    return false;
  }
}
