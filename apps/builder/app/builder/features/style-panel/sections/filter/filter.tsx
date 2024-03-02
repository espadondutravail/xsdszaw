import { CollapsibleSectionBase } from "~/builder/shared/collapsible-section";
import type { RenderCategoryProps } from "../../style-sections";
import { useState } from "react";
import {
  SectionTitle,
  SectionTitleButton,
  SectionTitleLabel,
} from "@webstudio-is/design-system";
import { getDots } from "../../shared/collapsible-section";
import { PropertyName } from "../../shared/property-name";
import { PlusIcon } from "@webstudio-is/icons";
import { type StyleProperty } from "@webstudio-is/css-engine";
import { getStyleSource } from "../../shared/style-info";
import { LayersList } from "../../style-layers-list";
import { FilterLayer } from "./filter-layer";
import { addLayer } from "../../style-layer-utils";
import { parseFilter } from "@webstudio-is/css-data";

const property: StyleProperty = "filter";
const label = "Filter";

export const FilterSection = (props: RenderCategoryProps) => {
  const { currentStyle, deleteProperty } = props;
  const [isOpen, setIsOpen] = useState(true);
  const layerStyleSource = getStyleSource(currentStyle[property]);
  const filterValue = currentStyle[property]?.value;

  return (
    <CollapsibleSectionBase
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
                  parseFilter("blur(0px)"),
                  currentStyle,
                  props.createBatchUpdate
                );
              }}
            />
          }
        >
          <PropertyName
            title={label}
            style={currentStyle}
            properties={[property]}
            description="Filter effects allow you to apply graphical effects like blurring, color shifting, and more to elements."
            label={
              <SectionTitleLabel color={layerStyleSource}>
                {label}
              </SectionTitleLabel>
            }
            onReset={() => deleteProperty(property)}
          />
        </SectionTitle>
      }
    >
      {filterValue?.type === "tuple" && filterValue.value.length > 0 && (
        <LayersList
          {...props}
          property={property}
          layers={filterValue}
          renderLayer={(layerProps) => (
            <FilterLayer {...layerProps} key={layerProps.index} />
          )}
        />
      )}
    </CollapsibleSectionBase>
  );
};