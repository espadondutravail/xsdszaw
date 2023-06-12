import { useState, type ReactElement } from "react";
import { useStore } from "@nanostores/react";
import type { Style, StyleProperty } from "@webstudio-is/css-data";
import { createCssEngine } from "@webstudio-is/css-engine";
import {
  theme,
  Button,
  Flex,
  Label,
  Tooltip,
  Text,
  ScrollArea,
} from "@webstudio-is/design-system";
import { ResetIcon } from "@webstudio-is/icons";
import {
  breakpointsStore,
  instancesStore,
  selectedBreakpointStore,
  selectedInstanceStore,
  selectedStyleSourceStore,
  styleSourcesStore,
} from "~/shared/nano-states";
import {
  type StyleInfo,
  getStyleSource,
  type StyleValueInfo,
} from "./style-info";
import { humanizeString } from "~/shared/string-utils";
import { StyleSourceBadge } from "../style-source";
import type { StyleSource, StyleSources } from "@webstudio-is/project-build";

const getSourceName = (
  styleSources: StyleSources,
  styleValueInfo: StyleValueInfo,
  selectedStyleSource?: StyleSource
) => {
  if (styleValueInfo.local) {
    return selectedStyleSource?.type === "token"
      ? selectedStyleSource.name
      : "Local";
  }

  if (styleValueInfo.nextSource) {
    const { styleSourceId } = styleValueInfo.nextSource;
    const styleSource = styleSources.get(styleSourceId);
    if (styleSource?.type === "local") {
      return "local";
    }
    if (styleSource?.type === "token") {
      return styleSource.name;
    }
  }

  if (styleValueInfo.previousSource) {
    const { styleSourceId } = styleValueInfo.previousSource;
    const styleSource = styleSources.get(styleSourceId);
    if (styleSource?.type === "local") {
      return "local";
    }
    if (styleSource?.type === "token") {
      return styleSource.name;
    }
  }
};

// @todo consider reusing CssPreview component
const getCssText = (
  properties: readonly StyleProperty[],
  instanceStyle: StyleInfo
) => {
  const cssEngine = createCssEngine();
  const style: Style = {};
  let property: StyleProperty;
  for (property in instanceStyle) {
    const value = instanceStyle[property];
    if (value && properties.includes(property)) {
      style[property] = value.value;
    }
  }
  const rule = cssEngine.addStyleRule("instance", {
    style,
  });
  return rule.styleMap.toString();
};

const TooltipContent = ({
  title,
  properties,
  description,
  style,
  onReset,
  onClose,
}: {
  title: string;
  description?: string;
  properties: readonly StyleProperty[];
  style: StyleInfo;
  onReset: () => void;
  onClose: () => void;
}) => {
  const breakpoints = useStore(breakpointsStore);
  const selectedBreakpoint = useStore(selectedBreakpointStore);
  const instances = useStore(instancesStore);
  const styleSources = useStore(styleSourcesStore);
  let instance = useStore(selectedInstanceStore);
  const selectedStyleSource = useStore(selectedStyleSourceStore);

  // When we have multiple properties, they must be originating from the same source, so we can just use one.
  const styleValueInfo = style[properties[0]];

  if (styleValueInfo === undefined) {
    return null;
  }

  const styleSource = getStyleSource(styleValueInfo);
  const sourceName = getSourceName(
    styleSources,
    styleValueInfo,
    selectedStyleSource
  );
  const cssText = getCssText(properties, style);
  let breakpoint = selectedBreakpoint;
  if (styleValueInfo?.cascaded) {
    const { breakpointId } = styleValueInfo.cascaded;
    breakpoint = breakpoints.get(breakpointId);
  }
  const breakpointName = breakpoint?.minWidth ?? breakpoint?.maxWidth ?? "Base";

  if (styleValueInfo?.inherited && styleValueInfo.preset === undefined) {
    instance = instances.get(styleValueInfo.inherited.instanceId);
  }

  return (
    <Flex direction="column" gap="2" css={{ maxWidth: theme.spacing[28] }}>
      <Text variant="titles">{title}</Text>
      {cssText && (
        <ScrollArea>
          <Text
            variant="monoBold"
            color="moreSubtle"
            css={{
              whiteSpace: "break-spaces",
              maxHeight: "3em",
              userSelect: "text",
              cursor: "text",
            }}
          >
            {cssText}
          </Text>
        </ScrollArea>
      )}
      {description && <Text>{description}</Text>}
      <Flex
        direction="column"
        gap="1"
        css={{ paddingBottom: theme.spacing[5] }}
      >
        <Text color="moreSubtle">Value comes from</Text>
        <Flex gap="1" wrap="wrap">
          <StyleSourceBadge source="breakpoint" variant="small">
            {breakpointName}
          </StyleSourceBadge>
          <StyleSourceBadge source="token" variant="small">
            {sourceName}
          </StyleSourceBadge>
          {instance && (
            <StyleSourceBadge source="instance" variant="small">
              {instance.label || instance.component}
            </StyleSourceBadge>
          )}
        </Flex>
      </Flex>
      {(styleSource === "local" || styleSource === "overwritten") && (
        <Button
          color="dark"
          prefix={<ResetIcon />}
          css={{ flexGrow: 1 }}
          onMouseDown={(event) => {
            // Prevent closing tooltip
            event.preventDefault();
          }}
          onClickCapture={() => {
            onReset();
            onClose();
          }}
        >
          Reset value
        </Button>
      )}
    </Flex>
  );
};

type PropertyNameProps = {
  style: StyleInfo;
  properties: readonly StyleProperty[];
  label: string | ReactElement;
  title?: string;
  onReset: () => void;
};

export const PropertyName = ({
  style,
  title,
  properties,
  label,
  onReset,
}: PropertyNameProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // When we have multiple properties, they must be originating from the same source, so we can just use one.
  const property = properties[0];

  return (
    <Flex align="center">
      <Tooltip
        open={isOpen}
        onOpenChange={setIsOpen}
        content={
          <TooltipContent
            title={
              title ??
              (typeof label === "string" ? label : humanizeString(property))
            }
            //description="The text will not wrap (break to the next line) if it overflows the container."
            properties={properties}
            style={style}
            onReset={onReset}
            onClose={() => {
              setIsOpen(false);
            }}
          />
        }
      >
        <Flex
          shrink
          gap={1}
          align="center"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          {typeof label === "string" && property ? (
            <Label color={getStyleSource(style[property])} truncate>
              {label}
            </Label>
          ) : (
            label
          )}
        </Flex>
      </Tooltip>
    </Flex>
  );
};
