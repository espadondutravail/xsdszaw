import { Image } from "./image";
import { Link } from "./link";
import { LinkBlock } from "./link-block";
import { RichTextLink } from "./rich-text-link";
import { imageProps } from "@webstudio-is/image";
import type { WsComponentPropsMeta } from "../../components/component-meta";

export const customComponents = {
  Image,
  Link,
  RichTextLink,
  LinkBlock,
};

export const customComponentPropsMetas: Record<string, WsComponentPropsMeta> = {
  Image: { props: imageProps },
};

// just for completeness, maybe we add soemthing here later
export const customComponentMetas = {};
