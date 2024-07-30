/* eslint-disable */
/* This is a auto generated file for building the project */

import { Fragment, useState } from "react";
import type { FontAsset, ImageAsset } from "@webstudio-is/sdk";
import { useResource } from "@webstudio-is/react-sdk";
import {
  Body as Body,
  Link as Link,
} from "@webstudio-is/sdk-components-react-remix";
import {
  Heading as Heading,
  Text as Text,
  Image as Image,
} from "@webstudio-is/sdk-components-react";

export const siteName = "";

export const favIconAsset: ImageAsset | undefined = undefined;

// Font assets on current page (can be preloaded)
export const pageFontAssets: FontAsset[] = [];

export const pageBackgroundImageAssets: ImageAsset[] = [];

export const CustomCode = () => {
  return <></>;
};

const Page = ({}: { system: any }) => {
  return (
    <Body className="w-body c1jaw2zx cbipm55 ctniqj4 ctgx88l">
      <Heading className="w-heading">{"Simple Project to test CLI"}</Heading>
      <Text className="w-text cn3rfux">
        {"Please don't change directly in the fixture"}
      </Text>
      <Link href={"/another-page"} className="w-link">
        {"Test another page link"}
      </Link>
      <Image
        src={"/assets/iconly_svg_converted-converted_zMaMiAAutUl8XrITgz7d1.svg"}
        width={14}
        height={16}
        className="w-image c161qeci"
      />
    </Body>
  );
};

export { Page };
