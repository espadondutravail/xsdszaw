import type {
  Breakpoint,
  Breakpoints,
  Instance,
  WebstudioFragment,
} from "@webstudio-is/sdk";
import type { WfElementNode, WfNode, WfStyle } from "./schema";
import { nanoid } from "nanoid";
import { $breakpoints } from "~/shared/nano-states";
import { parseCss } from "@webstudio-is/css-data";
// @todo this should be moved
import type { EmbedTemplateStyleDecl } from "@webstudio-is/react-sdk";
import { kebabCase } from "change-case";
import { equalMedia } from "@webstudio-is/css-engine";
import { isBaseBreakpoint } from "~/shared/breakpoints";
import type { Styles as WfStylePresets } from "./__generated__/style-presets";
import { builderApi } from "~/shared/builder-api";

const { toast } = builderApi;

type WfBreakpoint = { minWidth?: number; maxWidth?: number };

type WfBreakpointName =
  | "base"
  | "xxl"
  | "xl"
  | "large"
  | "medium"
  | "small"
  | "tiny";

const wfBreakpoints = new Map<WfBreakpointName, WfBreakpoint>([
  ["base", {}],
  ["xxl", { minWidth: 1920 }],
  ["xl", { minWidth: 1440 }],
  ["large", { minWidth: 1280 }],
  ["medium", { maxWidth: 991 }],
  ["small", { maxWidth: 767 }],
  ["tiny", { maxWidth: 479 }],
]);

const findWsBreakpoint = (
  wfBreakpoint: WfBreakpoint,
  breakpoints: Breakpoints
) => {
  return Array.from($breakpoints.get().values()).find((breakpoint) => {
    return equalMedia(breakpoint, wfBreakpoint);
  });
};

type UnparsedVariants = Map<
  WfBreakpointName,
  string | Array<EmbedTemplateStyleDecl>
>;

// Variants value can be wf styleLess string which is a styles block
// or it can be an array of EmbedTemplateStyleDecl.
// If its an array, convert it to ws style decl.
const toParsedVariants = (variants: UnparsedVariants) => {
  const parsedVariants = new Map<
    WfBreakpointName,
    Array<EmbedTemplateStyleDecl>
  >();

  for (const [breakpointName, styles] of variants) {
    if (typeof styles === "string") {
      try {
        const parsed = parseCss(`.styles {${styles}}`).styles ?? [];
        parsedVariants.set(breakpointName, parsed);
      } catch (error) {
        console.error("Failed to parse style", error, breakpointName, styles);
      }
      continue;
    }
    parsedVariants.set(breakpointName, styles);
  }

  return parsedVariants;
};

type BreakpointsByWfName = Map<WfBreakpointName, Breakpoint>;

const addBreakpoints = (
  breakpoints: Breakpoints,
  fragment: WebstudioFragment
) => {
  const add = (newBreakpoint: Breakpoint) => {
    const breakpoint = fragment.breakpoints.find((breakpoint) => {
      return equalMedia(breakpoint, newBreakpoint);
    });
    if (breakpoint === undefined) {
      fragment.breakpoints.push(newBreakpoint);
    }
  };
  // Creates a map of wf breakpoint name to ws breakpoint config:
  const wfBreakpointNameToId: BreakpointsByWfName = new Map();
  for (const [wfBreakpointName, wfBreakpoint] of wfBreakpoints) {
    if (wfBreakpointName === "base") {
      const baseBreakpoint = Array.from(breakpoints.values()).find(
        isBaseBreakpoint
      );
      if (baseBreakpoint) {
        wfBreakpointNameToId.set(wfBreakpointName, baseBreakpoint);
        add(baseBreakpoint);
      }
      continue;
    }

    const wsBreakpoint = findWsBreakpoint(wfBreakpoint, breakpoints);
    if (wsBreakpoint) {
      wfBreakpointNameToId.set(wfBreakpointName, wsBreakpoint);
      add(wsBreakpoint);
      continue;
    }
    const newBreakpoint: Breakpoint = {
      id: nanoid(),
      label: wfBreakpointName,
      ...(wfBreakpoint.minWidth !== undefined && {
        minWidth: wfBreakpoint.minWidth,
      }),
      ...(wfBreakpoint.maxWidth !== undefined && {
        maxWidth: wfBreakpoint.maxWidth,
      }),
    };

    add(newBreakpoint);
    wfBreakpointNameToId.set(wfBreakpointName, newBreakpoint);
  }
  return wfBreakpointNameToId;
};

const addNodeStyles = ({
  name,
  variants,
  instanceId,
  fragment,
  breakpointsByName,
}: {
  name: string;
  variants: UnparsedVariants;
  instanceId: Instance["id"];
  fragment: WebstudioFragment;
  breakpointsByName: BreakpointsByWfName;
}) => {
  const parsedVariants = toParsedVariants(variants);

  const styleSourceId = nanoid();
  fragment.styleSources.push({
    type: "token",
    id: styleSourceId,
    name,
  });

  let styleSourceSelection = fragment.styleSourceSelections.find(
    (selection) => selection.instanceId === instanceId
  );
  if (styleSourceSelection === undefined) {
    styleSourceSelection = { instanceId, values: [] };
    fragment.styleSourceSelections.push(styleSourceSelection);
  }
  styleSourceSelection.values.push(styleSourceId);

  for (const [breakpointName, styles] of parsedVariants) {
    const breakpoint = breakpointsByName.get(breakpointName);
    if (breakpoint === undefined) {
      console.error(`No breakpoint found for ${breakpointName}`);
      continue;
    }

    for (const style of styles) {
      fragment.styles.push({
        styleSourceId,
        breakpointId: breakpoint.id,
        property: style.property,
        value: style.value,
        state: style.state,
      });
      if (style.value.type === "invalid") {
        const error = `Invalid style value: "${kebabCase(style.property)}: ${style.value.value}"`;
        toast.error(error);
        console.error(error);
      }
    }
  }
};

const mapComponentAndPresetStyles = (
  wfNode: WfElementNode,
  stylePresets: WfStylePresets
) => {
  const component = wfNode.type;
  const presetStyles: Array<keyof WfStylePresets> = [];

  if (wfNode.tag in stylePresets) {
    presetStyles.push(wfNode.tag as keyof typeof stylePresets);
  }

  switch (component) {
    case "Link": {
      const data = wfNode.data;
      if (data.button) {
        presetStyles.push("w-button");
      }
      if (data.block === "inline") {
        presetStyles.push("w-inline-block");
      }
      return presetStyles;
    }
    case "CodeBlock": {
      presetStyles.push("w-code-block");
      return presetStyles;
    }
    case "HtmlEmbed": {
      presetStyles.push("w-embed");
      return presetStyles;
    }
    case "BlockContainer": {
      presetStyles.push("w-container");
      return presetStyles;
    }
    case "Row": {
      presetStyles.push("w-row");
      return presetStyles;
    }
    case "Column": {
      presetStyles.push("w-col");
      return presetStyles;
    }
    case "FormWrapper": {
      presetStyles.push("w-form");
      return presetStyles;
    }
    case "FormTextInput":
    case "FormTextarea": {
      presetStyles.push("w-input");
      return presetStyles;
    }
    case "FormButton": {
      presetStyles.push("w-button");
      return presetStyles;
    }
    case "FormCheckboxWrapper": {
      presetStyles.push("w-checkbox");
      return presetStyles;
    }
    case "FormCheckboxInput": {
      presetStyles.push("w-checkbox-input");
      return presetStyles;
    }
    case "FormInlineLabel": {
      presetStyles.push("w-form-label");
      return presetStyles;
    }
  }

  return presetStyles;
};

export const addStyles = async (
  wfNodes: Map<WfNode["_id"], WfNode>,
  wfStyles: Map<WfStyle["_id"], WfStyle>,
  doneNodes: Map<WfNode["_id"], Instance["id"] | false>,
  fragment: WebstudioFragment
) => {
  const { styles: stylePresets } = await import(
    "./__generated__/style-presets"
  );

  for (const wfNode of wfNodes.values()) {
    if ("text" in wfNode) {
      continue;
    }
    const instanceId = doneNodes.get(wfNode._id);
    if (instanceId === false) {
      continue;
    }
    if (instanceId === undefined) {
      console.error(`No instance id found for node ${wfNode._id}`);
      continue;
    }

    const breakpointsByName = addBreakpoints($breakpoints.get(), fragment);

    mapComponentAndPresetStyles(wfNode, stylePresets).forEach((name) => {
      addNodeStyles({
        name,
        variants: new Map([
          ["base", stylePresets[name] as Array<EmbedTemplateStyleDecl>],
        ]),
        instanceId,
        fragment,
        breakpointsByName,
      });
    });

    const instance = fragment.instances.find(
      (instance) => instance.id === instanceId
    );

    if (instance === undefined) {
      console.error(`No instance found for ${instanceId}`);
      continue;
    }

    for (const classId of wfNode.classes) {
      const style = wfStyles.get(classId);
      if (style === undefined) {
        continue;
      }
      if (instance && instance.label === undefined) {
        instance.label = style.name;
      }
      const variants = new Map();
      variants.set("base", style.styleLess);
      const wfVariants = style.variants ?? {};
      Object.keys(wfVariants).forEach((breakpointName) => {
        const variant = wfVariants[breakpointName as keyof typeof wfVariants];
        if (variant && "styleLess" in variant) {
          variants.set(breakpointName, variant.styleLess);
        }
      });
      addNodeStyles({
        name: style.name,
        variants,
        instanceId,
        fragment,
        breakpointsByName,
      });
    }
  }
};
