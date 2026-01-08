import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  closeMainWindow,
  showToast,
} from '@vicinae/api';
import { useEffect, useState } from 'react';
import SessionPreview from './components/session-preview';
import { getZellijSessions, isZellijInstalled } from './utils/zellij';
import { getTerminalCommand } from './utils/terminal';
import type { ZellijSession } from './types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export default function ListSessions() {
  const [sessions, setSessions] = useState<ZellijSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zellijInstalled, setZellijInstalled] = useState<boolean>(true);

  const loadSessions = async () => {
    try {
      setIsLoading(true);

      const installed = await isZellijInstalled();
      setZellijInstalled(installed);

      if (!installed) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'Zellij not found',
          message: 'Please install Zellij to use this extension',
        });
        setSessions([]);
        return;
      }

      const fetchedSessions = await getZellijSessions();
      setSessions(fetchedSessions);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to load sessions',
        message: error instanceof Error ? error.message : String(error),
      });
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const handleAttachSession = async (session: ZellijSession) => {
    try {
      const command = getTerminalCommand(session.name, true);
      await execAsync(command.join(' '));
      await closeMainWindow();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to open session',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleDeleteSession = async (session: ZellijSession) => {
    try {
      await execAsync(`zellij delete-session ${session.name}`);
      await loadSessions();
      await showToast({
        style: Toast.Style.Success,
        title: 'Session deleted',
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to delete session',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  if (!zellijInstalled) {
    return (
      <List>
        <List.EmptyView
          title="Zellij Not Found"
          description="Please install Zellij to use this extension"
          icon={Icon.Exclamationmark}
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} isShowingDetail={sessions.length > 0}>
      {sessions.length === 0 ? (
        !isLoading ? (
          <List.EmptyView
            title="No Sessions Found"
            description="Create a new Zellij session to get started"
            icon={Icon.Terminal}
          />
        ) : null
      ) : (
        sessions.map((session) => (
          <List.Item
            key={session.name}
            title={session.name}
            subtitle={session.isAttached ? 'Attached' : 'Detached'}
            icon={session.isAttached ? Icon.CircleFilled : Icon.Circle}
            detail={<SessionPreview session={session} />}
            actions={
              <ActionPanel>
                <Action
                  title="Attach to Session"
                  icon={Icon.Terminal}
                  onAction={() => handleAttachSession(session)}
                />
                <Action
                  title="Delete Session"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleDeleteSession(session)}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ['cmd'], key: 'r' }}
                  onAction={loadSessions}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
