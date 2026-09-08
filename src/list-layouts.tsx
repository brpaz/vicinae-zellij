import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  Action,
  ActionPanel,
  closeMainWindow,
  Icon,
  List,
  showToast,
  Toast,
} from '@vicinae/api';
import { useEffect, useState } from 'react';
import type { ZellijLayout } from './types';
import { getTerminalCommand } from './utils/terminal';
import { getZellijLayouts, isZellijInstalled } from './utils/zellij';

const execAsync = promisify(exec);

export default function ListLayouts() {
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
