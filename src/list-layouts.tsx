import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  Action,
  ActionPanel,
  Alert,
  closeMainWindow,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useEffect, useState } from 'react';
import type { ZellijLayout, ZellijSession } from './types';
import { getTerminalCommand } from './utils/terminal';
import {
  applyLayoutToSession,
  getZellijLayouts,
  getZellijSessions,
  isZellijInstalled,
} from './utils/zellij';

const execAsync = promisify(exec);

export default function ListLayouts() {
  const { push } = useNavigation();
  const [layouts, setLayouts] = useState<ZellijLayout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zellijInstalled, setZellijInstalled] = useState<boolean>(true);

  const loadLayouts = async () => {
    try {
      setIsLoading(true);

      const installed = await isZellijInstalled();
      setZellijInstalled(installed);

      if (!installed) {
        setLayouts([]);
        return;
      }

      const fetchedLayouts = await getZellijLayouts();
      setLayouts(fetchedLayouts);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to load layouts',
        message: error instanceof Error ? error.message : String(error),
      });
      setLayouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    loadLayouts();
  }, []);

  const handleOpenLayout = async (layout: ZellijLayout) => {
    try {
      const command = getTerminalCommand(layout.path, false);
      await execAsync(command.join(' '));
      await closeMainWindow();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to open layout',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <List isLoading={isLoading}>
      {layouts.length === 0 ? (
        !isLoading ? (
          <List.EmptyView
            title={!zellijInstalled ? 'Zellij Not Found' : 'No Layouts Found'}
            description={
              !zellijInstalled
                ? 'Please install Zellij to use this extension'
                : 'Add layouts to ~/.config/zellij/layouts to get started'
            }
            icon={!zellijInstalled ? Icon.Exclamationmark : Icon.AppWindowList}
          />
        ) : null
      ) : (
        layouts.map((layout) => (
          <List.Item
            key={layout.path}
            title={layout.name}
            subtitle={layout.path}
            icon={Icon.AppWindowList}
            actions={
              <ActionPanel>
                <Action
                  title="Open Layout"
                  icon={Icon.Terminal}
                  onAction={() => handleOpenLayout(layout)}
                />
                <Action
                  title="Apply to Running Session"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ['cmd'], key: 'a' }}
                  onAction={() =>
                    push(<SelectSessionForLayout layout={layout} />)
                  }
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ['cmd'], key: 'r' }}
                  onAction={loadLayouts}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

function SelectSessionForLayout({ layout }: { layout: ZellijLayout }) {
  const { pop } = useNavigation();
  const [sessions, setSessions] = useState<ZellijSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const fetchedSessions = await getZellijSessions();
      setSessions(fetchedSessions.filter((session) => session.active));
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

  const handleApply = async (session: ZellijSession) => {
    const confirmed = await confirmAlert({
      title: `Replace layout of "${session.name}"?`,
      message: `This closes every existing tab and pane in "${session.name}" and replaces them with "${layout.name}". This cannot be undone.`,
      primaryAction: {
        title: 'Replace',
        style: Alert.ActionStyle.Destructive,
      },
    });
    if (!confirmed) return;

    try {
      await applyLayoutToSession(session.name, layout.path);
      await showToast({
        style: Toast.Style.Success,
        title: 'Layout applied',
        message: `"${session.name}" now uses "${layout.name}"`,
      });
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to apply layout',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <List isLoading={isLoading} navigationTitle={`Apply "${layout.name}" to`}>
      {sessions.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No Active Sessions"
          description="Start a session before applying a layout to it"
          icon={Icon.Terminal}
        />
      ) : (
        sessions.map((session) => (
          <List.Item
            key={session.name}
            title={session.name}
            icon={Icon.Terminal}
            actions={
              <ActionPanel>
                <Action
                  title="Apply Layout"
                  icon={Icon.ArrowClockwise}
                  onAction={() => handleApply(session)}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
