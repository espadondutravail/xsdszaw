import { ComponentProps, useState } from "react";
import type { StyleValue, StyleProperty } from "@webstudio-is/css-data";
import { Box, EnhancedTooltip } from "@webstudio-is/design-system";
import { CssValueInput, type IntermediateStyleValue } from ".";
import type { StyleSource } from "../style-info";
import type { DeleteProperty, SetValue } from "../use-style-data";

type CssValueInputContainerProps = {
  property: StyleProperty;
  keywords: ComponentProps<typeof CssValueInput>["keywords"];
  label: string;
  styleSource: StyleSource;
  value?: StyleValue;
  setValue: SetValue;
  deleteProperty: DeleteProperty;
};

export const CssValueInputContainer = ({
  property,
  keywords,
  label,
  styleSource,
  value,
  setValue,
  deleteProperty,
}: CssValueInputContainerProps) => {
  const [intermediateValue, setIntermediateValue] = useState<
    StyleValue | IntermediateStyleValue
  >();

  return (
    <EnhancedTooltip content={label}>
      <Box>
        <CssValueInput
          styleSource={styleSource}
          property={property}
          value={value}
          intermediateValue={intermediateValue}
          keywords={keywords}
          onChange={(styleValue) => {
            setIntermediateValue(styleValue);

            if (styleValue === undefined) {
              deleteProperty(property, { isEphemeral: true });
              return;
            }

            if (styleValue.type !== "intermediate") {
              setValue(styleValue, { isEphemeral: true });
            }
          }}
          onHighlight={(styleValue) => {
            if (styleValue !== undefined) {
              setValue(styleValue, { isEphemeral: true });
            } else {
              deleteProperty(property, { isEphemeral: true });
            }
          }}
          onChangeComplete={({ value }) => {
            setValue(value);
            setIntermediateValue(undefined);
          }}
          onAbort={() => {
            deleteProperty(property, { isEphemeral: true });
          }}
        />
      </Box>
    </EnhancedTooltip>
  );
};
