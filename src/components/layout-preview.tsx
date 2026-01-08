import { List, Icon } from '@vicinae/api';
import type { ZellijLayout } from '../types';

interface LayoutPreviewProps {
  layout: ZellijLayout;
}

export default function LayoutPreview({ layout }: LayoutPreviewProps) {
  const markdown = `# ${layout.name}

**Path:** \`${layout.path}\`

Use the actions below to open this layout in a new Zellij session.
`;

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label
            title="Layout Name"
            text={layout.name}
            icon={Icon.AppWindowList}
          />

          <List.Item.Detail.Metadata.Separator />

          <List.Item.Detail.Metadata.Label
            title="Path"
            text={layout.path}
            icon={Icon.Folder}
          />
        </List.Item.Detail.Metadata>
      }
    />
  );
}
