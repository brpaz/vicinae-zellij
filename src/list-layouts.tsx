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
import LayoutPreview from './components/layout-preview';
import { getZellijLayouts, isZellijInstalled } from './utils/zellij';
import { getTerminalCommand } from './utils/terminal';
import type { ZellijLayout } from './types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

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
        await showToast({
          style: Toast.Style.Failure,
          title: 'Zellij not found',
          message: 'Please install Zellij to use this extension',
        });
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
    <List isLoading={isLoading} isShowingDetail={layouts.length > 0}>
      {layouts.length === 0 ? (
        !isLoading ? (
          <List.EmptyView
            title="No Layouts Found"
            description="Add layouts to ~/.config/zellij/layouts to get started"
            icon={Icon.AppWindowList}
          />
        ) : null
      ) : (
        layouts.map((layout) => (
          <List.Item
            key={layout.path}
            title={layout.name}
            subtitle={layout.path}
            icon={Icon.AppWindowList}
            detail={<LayoutPreview layout={layout} />}
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
