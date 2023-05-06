import { BoldIcon } from "@webstudio-is/icons";
import type {
  PresetStyle,
  WsComponentMeta,
  WsComponentPropsMeta,
} from "./component-meta";
import { props } from "./__generated__/bold.props";
import { b } from "../css/normalize";
import type { defaultTag } from "./bold";

const presetStyle = {
  b,
} satisfies PresetStyle<typeof defaultTag>;

export const meta: WsComponentMeta = {
  type: "rich-text-child",
  label: "Bold Text",
  Icon: BoldIcon,
  presetStyle,
};

export const propsMeta: WsComponentPropsMeta = {
  props,
};
