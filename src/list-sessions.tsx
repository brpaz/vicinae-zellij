import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  Action,
  ActionPanel,
  Color,
  closeMainWindow,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@vicinae/api';
import { useEffect, useState } from 'react';
import type { ZellijSession } from './types';
import { getTerminalCommand } from './utils/terminal';
import {
  getZellijSessions,
  isZellijInstalled,
  newTabInSession,
  renameSession,
  runCommandInSession,
} from './utils/zellij';

const execAsync = promisify(exec);

export default function ListSessions() {
  const { push } = useNavigation();
  const [sessions, setSessions] = useState<ZellijSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zellijInstalled, setZellijInstalled] = useState<boolean>(true);

  const loadSessions = async () => {
    try {
      setIsLoading(true);

      const installed = await isZellijInstalled();
      setZellijInstalled(installed);

      if (!installed) {
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

  const handleRunCommand = async (session: ZellijSession, command: string) => {
    try {
      await runCommandInSession(session.name, command);
      await showToast({
        style: Toast.Style.Success,
        title: 'Command sent',
        message: `Running in "${session.name}"`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to run command',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleNewTab = async (session: ZellijSession, tabName: string) => {
    try {
      await newTabInSession(session.name, tabName || undefined);
      await showToast({
        style: Toast.Style.Success,
        title: 'Tab created',
        message: `Added to "${session.name}"`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to create tab',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRename = async (session: ZellijSession, newName: string) => {
    try {
      await renameSession(session.name, newName);
      await loadSessions();
      await showToast({
        style: Toast.Style.Success,
        title: 'Session renamed',
        message: `"${session.name}" -> "${newName}"`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Failed to rename session',
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

  return (
    <List isLoading={isLoading}>
      {sessions.length === 0 ? (
        !isLoading ? (
          <List.EmptyView
            title={!zellijInstalled ? 'Zellij Not Found' : 'No Sessions Found'}
            description={
              !zellijInstalled
                ? 'Please install Zellij to use this extension'
                : 'Create a new Zellij session to get started'
            }
            icon={!zellijInstalled ? Icon.Exclamationmark : Icon.Terminal}
          />
        ) : null
      ) : (
        sessions.map((session) => (
          <List.Item
            key={session.name}
            title={session.name}
            icon={Icon.Terminal}
            accessories={[
              session.active
                ? { tag: { value: 'Active', color: Color.Green } }
                : { tag: { value: 'Exited', color: Color.SecondaryText } },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Attach to Session"
                  icon={Icon.Terminal}
                  onAction={() => handleAttachSession(session)}
                />
                {session.active && (
                  <Action
                    title="Run Command in Session"
                    icon={Icon.Terminal}
                    shortcut={{ modifiers: ['cmd'], key: 'e' }}
                    onAction={() =>
                      push(
                        <RunCommandForm
                          session={session}
                          onSubmit={handleRunCommand}
                        />
                      )
                    }
                  />
                )}
                {session.active && (
                  <Action
                    title="New Tab in Session"
                    icon={Icon.Plus}
                    shortcut={{ modifiers: ['cmd'], key: 't' }}
                    onAction={() =>
                      push(
                        <NewTabForm session={session} onSubmit={handleNewTab} />
                      )
                    }
                  />
                )}
                {session.active && (
                  <Action
                    title="Rename Session"
                    icon={Icon.Pencil}
                    shortcut={{ modifiers: ['cmd'], key: 'n' }}
                    onAction={() =>
                      push(
                        <RenameSessionForm
                          session={session}
                          onSubmit={handleRename}
                        />
                      )
                    }
                  />
                )}
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

function RunCommandForm({
  session,
  onSubmit,
}: {
  session: ZellijSession;
  onSubmit: (session: ZellijSession, command: string) => Promise<void>;
}) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Run Command"
            onSubmit={async (values: Form.Values) => {
              const command = String(values.command ?? '');
              if (!command) return;
              await onSubmit(session, command);
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        text={`Runs in a new pane in "${session.name}", without attaching.`}
      />
      <Form.TextField id="command" title="Command" info="e.g. htop" />
    </Form>
  );
}

function NewTabForm({
  session,
  onSubmit,
}: {
  session: ZellijSession;
  onSubmit: (session: ZellijSession, tabName: string) => Promise<void>;
}) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Create Tab"
            onSubmit={async (values: Form.Values) => {
              await onSubmit(session, String(values.name ?? ''));
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text={`Adds a new tab to "${session.name}".`} />
      <Form.TextField id="name" title="Tab Name" info="Optional" />
    </Form>
  );
}

function RenameSessionForm({
  session,
  onSubmit,
}: {
  session: ZellijSession;
  onSubmit: (session: ZellijSession, newName: string) => Promise<void>;
}) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Rename Session"
            onSubmit={async (values: Form.Values) => {
              const newName = String(values.name ?? '');
              if (!newName) return;
              await onSubmit(session, newName);
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="New Name" defaultValue={session.name} />
    </Form>
  );
}
