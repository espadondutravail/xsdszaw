import { useStore } from "@nanostores/react";
import { styled } from "@webstudio-is/design-system";
import { Image as WebstudioImage } from "@webstudio-is/image";
import type { AssetContainer } from "../assets";
import brokenImage from "~/shared/images/broken-image-placeholder.svg";
import { $imageLoader } from "~/shared/nano-states";

type ImageProps = {
  assetContainer: AssetContainer;
  alt: string;
  width: number;
};

const StyledWebstudioImage = styled(WebstudioImage, {
  position: "absolute",
  width: "100%",
  height: "100%",
  objectFit: "contain",

  // This is shown only if an image was not loaded and broken
  // From the spec:
  // - The pseudo-elements generated by ::before and ::after are contained by the element's formatting box,
  //   and thus don't apply to "replaced" elements such as <img>, or to <br> elements
  // Not in spec but supported by all browsers:
  // - broken image is not a "replaced" element so this style is applied
  "&::after": {
    content: "' '",
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundImage: `url(${brokenImage})`,
  },
});

export const Image = ({ assetContainer, alt, width }: ImageProps) => {
  const { asset } = assetContainer;
  const optimize = assetContainer.status === "uploaded";
  const imageLoader = useStore($imageLoader);

  // Avoid image flickering on switching from preview to asset (during upload)
  // Possible optimisation, we can set it to "sync" only if asset.path has changed or add isNew prop to UploadedAssetContainer
  const decoding = "sync";

  const src =
    assetContainer.status === "uploading"
      ? assetContainer.objectURL
      : asset.name;

  return (
    <StyledWebstudioImage
      style={{
        // Prevent native image drag in Image Manager to avoid issues with monitorForExternal
        // from @atlaskit/pragmatic-drag-and-drop, which incorrectly identifies it as an external drag operation
        // when used inside an iframe.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        webkitUserDrag: "none",
      }}
      key={asset.id}
      loader={imageLoader}
      decoding={decoding}
      src={src}
      width={width}
      optimize={optimize}
      alt={alt}
    />
  );
};
