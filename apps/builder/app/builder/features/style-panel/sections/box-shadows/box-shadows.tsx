import {
  SectionTitle,
  SectionTitleButton,
  SectionTitleLabel,
} from "@webstudio-is/design-system";
import { PlusIcon } from "@webstudio-is/icons";
import type { StyleProperty, TupleValue } from "@webstudio-is/css-engine";
import { CollapsibleSectionRoot } from "~/builder/shared/collapsible-section";
import { useState } from "react";
import { getDots } from "../../shared/collapsible-section";
import { PropertyName } from "../../shared/property-name";
import { getStyleSource } from "../../shared/style-info";
import type { RenderCategoryProps } from "../../style-sections";
import { LayersList } from "../../style-layers-list";
import { BoxShadowLayer } from "./box-shadow-layer";
import { addLayer } from "../../style-layer-utils";
import { parseBoxShadow } from "@webstudio-is/css-data";

const property: StyleProperty = "boxShadow";
const label = "Box Shadows";
const INITIAL_BOX_SHADOW = "0px 2px 5px 0px rgba(0, 0, 0, 0.2)";

export const BoxShadowsSection = (props: RenderCategoryProps) => {
  const { currentStyle, deleteProperty } = props;
  const [isOpen, setIsOpen] = useState(true);
  const layersStyleSource = getStyleSource(currentStyle[property]);
  const value = currentStyle[property]?.value;

  return (
    <CollapsibleSectionRoot
      fullWidth
      label={label}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <SectionTitle
          dots={getDots(currentStyle, [property])}
          suffix={
            <SectionTitleButton
              prefix={<PlusIcon />}
              onClick={() => {
                addLayer(
                  property,
                  parseBoxShadow(INITIAL_BOX_SHADOW),
                  currentStyle,
                  props.createBatchUpdate
                );
                setIsOpen(true);
              }}
            />
          }
        >
          <PropertyName
            title="Box Shadows"
            style={currentStyle}
            properties={[property]}
            description="Adds shadow effects around an element's frame."
            label={
              <SectionTitleLabel color={layersStyleSource}>
                {label}
              </SectionTitleLabel>
            }
            onReset={() => deleteProperty(property)}
          />
        </SectionTitle>
      }
    >
      {value?.type === "layers" && value.value.length > 0 && (
        <LayersList<TupleValue>
          property={property}
          layers={value}
          {...props}
          renderLayer={(layersProps) => (
            <BoxShadowLayer key={layersProps.index} {...layersProps} />
          )}
        />
      )}
    </CollapsibleSectionRoot>
  );
};
