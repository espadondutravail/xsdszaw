import {
  Button,
  FloatingPanelPopover,
  FloatingPanelPopoverContent,
  FloatingPanelPopoverTitle,
  FloatingPanelPopoverTrigger,
  theme,
  Tooltip,
} from "@webstudio-is/design-system";
import type { Project } from "@webstudio-is/prisma-client";
import { ShareProjectContainer } from "~/shared/share-project";
import { useAuthPermit } from "~/shared/nano-states";

export const ShareButton = ({ projectId }: { projectId: Project["id"] }) => {
  const [authPermit] = useAuthPermit();

  const isShareDisabled = authPermit === "view";
  const tooltipContent = isShareDisabled
    ? "Only owner can share projects"
    : undefined;

  return (
    <FloatingPanelPopover modal>
      <FloatingPanelPopoverTrigger asChild>
        <Tooltip side="bottom" content={tooltipContent}>
          <Button disabled={isShareDisabled}>Share</Button>
        </Tooltip>
      </FloatingPanelPopoverTrigger>

      <FloatingPanelPopoverContent css={{ zIndex: theme.zIndices[1] }}>
        <ShareProjectContainer projectId={projectId} />
        <FloatingPanelPopoverTitle>Share</FloatingPanelPopoverTitle>
      </FloatingPanelPopoverContent>
    </FloatingPanelPopover>
  );
};
