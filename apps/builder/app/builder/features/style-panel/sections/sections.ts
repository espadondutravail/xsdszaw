import type { ReactNode } from "react";
import * as layout from "./layout/layout";
import * as flexChild from "./flex-child/flex-child";
import * as listItem from "./list-item";
import * as space from "./space/space";
import * as size from "./size/size";
import * as position from "./position/position";
import * as typography from "./typography/typography";
import * as backgrounds from "./backgrounds/backgrounds";
import * as borders from "./borders/borders";
import * as boxShadows from "./box-shadows/box-shadows";
import * as filter from "./filter/filter";
import * as transitions from "./transitions/transitions";
import * as outline from "./outline/outline";
import * as advanced from "./advanced/advanced";
import * as textShadows from "./text-shadows/text-shadows";
import * as backdropFilter from "./backdrop-filter/backdrop-filter";
import type { StyleProperty } from "@webstudio-is/css-engine";
import type { SectionProps } from "./shared/section";

export const sections = new Map<
  string,
  {
    properties: StyleProperty[];
    Section: (props: SectionProps) => ReactNode;
  }
>([
  ["filter", filter],
  ["layout", layout],
  ["flexChild", flexChild],
  ["listItem", listItem],
  ["space", space],
  ["size", size],
  ["position", position],
  ["typography", typography],
  ["textShadows", textShadows],
  ["backgrounds", backgrounds],
  ["borders", borders],
  ["boxShadows", boxShadows],
  ["backdropFilters", backdropFilter],
  ["transitions", transitions],
  ["outline", outline],
  ["advanced", advanced],
]);
