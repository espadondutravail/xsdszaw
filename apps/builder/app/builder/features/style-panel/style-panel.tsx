import { Fragment } from "react";
import {
  theme,
  Box,
  Card,
  Text,
  Separator,
  ScrollArea,
} from "@webstudio-is/design-system";
import type { Instance } from "@webstudio-is/sdk";
import { useStore } from "@nanostores/react";
import { computed } from "nanostores";

import { useStyleData } from "./shared/use-style-data";

import { StyleSourcesSection } from "./style-source-section";
import { $selectedInstanceRenderState } from "~/shared/nano-states";
import {
  $selectedInstanceIntanceToTag,
  $selectedInstanceSelector,
} from "~/shared/nano-states";
import {
  categories,
  renderCategory,
  shouldRenderCategory,
  type RenderCategoryProps,
} from "./style-sections";
import { useParentStyle } from "./parent-style";

const $selectedInstanceTag = computed(
  [$selectedInstanceSelector, $selectedInstanceIntanceToTag],
  (instanceSelector, instanceToTag) => {
    if (instanceSelector === undefined || instanceToTag === undefined) {
      return;
    }
    return instanceToTag.get(instanceSelector[0]);
  }
);

type StylePanelProps = {
  selectedInstance: Instance;
};

export const StylePanel = ({ selectedInstance }: StylePanelProps) => {
  const { currentStyle, setProperty, deleteProperty, createBatchUpdate } =
    useStyleData({
      selectedInstance,
    });

  const selectedInstanceRenderState = useStore($selectedInstanceRenderState);
  const selectedInstanceTag = useStore($selectedInstanceTag);
  const parentStyle = useParentStyle();

  // If selected instance is not rendered on the canvas,
  // style panel will not work, because it needs the element in DOM in order to work.
  // See <SelectedInstanceConnector> for more details.
  if (selectedInstanceRenderState === "notMounted") {
    return (
      <Box css={{ p: theme.spacing[5] }}>
        <Card css={{ p: theme.spacing[9], width: "100%" }}>
          <Text>Select an instance on the canvas</Text>
        </Card>
      </Box>
    );
  }

  const all = [];
  for (const category of categories) {
    const categoryProps: RenderCategoryProps = {
      setProperty,
      deleteProperty,
      createBatchUpdate,
      currentStyle,
      category,
    };

    if (shouldRenderCategory(categoryProps, parentStyle, selectedInstanceTag)) {
      all.push(
        <Fragment key={category}>{renderCategory(categoryProps)}</Fragment>
      );
    }
  }

  return (
    <>
      <Box
        css={{
          px: theme.spacing[9],
          pb: theme.spacing[9],
        }}
      >
        <Text css={{ py: theme.spacing[7] }} variant="titles">
          Style Sources
        </Text>
        <StyleSourcesSection />
      </Box>
      <Separator />
      <ScrollArea>{all}</ScrollArea>
    </>
  );
};
