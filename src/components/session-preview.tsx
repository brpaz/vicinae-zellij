import { List, Icon } from '@vicinae/api';
import type { ZellijSession } from '../types';

interface SessionPreviewProps {
  session: ZellijSession;
}

export default function SessionPreview({ session }: SessionPreviewProps) {
  const markdown = `# ${session.name}

${session.isAttached ? '**Status:** Currently Attached' : '**Status:** Detached'}

Use the actions below to attach to this session.
`;

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label
            title="Session Name"
            text={session.name}
            icon={Icon.Terminal}
          />

          <List.Item.Detail.Metadata.Separator />

          <List.Item.Detail.Metadata.Label
            title="Status"
            text={session.isAttached ? 'Attached' : 'Detached'}
            icon={session.isAttached ? Icon.CircleFilled : Icon.Circle}
          />

          {session.tabCount !== undefined && (
            <List.Item.Detail.Metadata.Label
              title="Tabs"
              text={String(session.tabCount)}
              icon={Icon.AppWindow}
            />
          )}
        </List.Item.Detail.Metadata>
      }
    />
  );
}
