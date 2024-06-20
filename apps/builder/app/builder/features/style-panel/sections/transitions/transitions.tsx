import type { StyleProperty } from "@webstudio-is/css-engine";
import { useState, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { InfoCircleIcon, PlusIcon } from "@webstudio-is/icons";
import {
  SectionTitle,
  SectionTitleButton,
  SectionTitleLabel,
  Text,
  Tooltip,
} from "@webstudio-is/design-system";

import { CollapsibleSectionRoot } from "~/builder/shared/collapsible-section";
import type { SectionProps } from "../shared/section";
import { getDots } from "../../shared/collapsible-section";
import { PropertyName } from "../../shared/property-name";
import { LayersList } from "../../style-layers-list";
import { $selectedOrLastStyleSourceSelector } from "~/shared/nano-states";
import { TransitionContent } from "./transition-content";
import {
  initialTransition,
  getTransitionProperties,
  deleteTransitionProperties,
  addDefaultTransitionLayer,
  deleteTransitionLayer,
  transitionProperties,
  editTransitionLayer,
  swapTransitionLayers,
  hideTransitionLayer,
  convertIndividualTransitionToLayers,
} from "./transition-utils";

const label = "Transitions";
export const properties = Array.from(
  transitionProperties
) satisfies Array<StyleProperty>;

export const Section = (props: SectionProps) => {
  const { currentStyle, createBatchUpdate } = props;
  const [isOpen, setIsOpen] = useState(true);
  const transitionProperties = getTransitionProperties(currentStyle);
  const layers = useMemo(
    () => convertIndividualTransitionToLayers(transitionProperties),
    [transitionProperties]
  );

  const selectedOrLastStyleSourceSelector = useStore(
    $selectedOrLastStyleSourceSelector
  );

  const isStyleInLocalState =
    selectedOrLastStyleSourceSelector &&
    selectedOrLastStyleSourceSelector.state === undefined;

  return (
    <CollapsibleSectionRoot
      fullWidth
      label={label}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <SectionTitle
          dots={getDots(currentStyle, properties)}
          suffix={
            <Tooltip
              content={
                isStyleInLocalState === false
                  ? "Transitions can only be added in local state"
                  : "Add a transition"
              }
            >
              <SectionTitleButton
                disabled={isStyleInLocalState === false}
                prefix={<PlusIcon />}
                onClick={() =>
                  addDefaultTransitionLayer({
                    createBatchUpdate,
                    currentStyle,
                  })
                }
              />
            </Tooltip>
          }
        >
          <PropertyName
            title={label}
            style={currentStyle}
            description="Animate the transition between states on this instance."
            properties={properties}
            label={<SectionTitleLabel>{label}</SectionTitleLabel>}
            onReset={() =>
              deleteTransitionProperties({
                createBatchUpdate,
              })
            }
          />
        </SectionTitle>
      }
    >
      {layers.value.length > 0 && (
        <LayersList
          {...props}
          property={properties[0]}
          value={layers}
          label={label}
          deleteProperty={() =>
            deleteTransitionProperties({
              createBatchUpdate,
            })
          }
          deleteLayer={(index) =>
            deleteTransitionLayer({
              index,
              createBatchUpdate,
              currentStyle,
            })
          }
          swapLayers={(oldIndex, newIndex) =>
            swapTransitionLayers({
              oldIndex,
              newIndex,
              createBatchUpdate,
              currentStyle,
            })
          }
          hideLayer={(index) => {
            hideTransitionLayer({
              index,
              createBatchUpdate,
              currentStyle,
            });
          }}
          renderContent={(layerProps) => {
            if (layerProps.layer.type !== "tuple") {
              return <></>;
            }

            return (
              <TransitionContent
                {...layerProps}
                layer={layerProps.layer}
                onEditLayer={(index, layer, options) =>
                  editTransitionLayer({
                    index,
                    layer,
                    options,
                    createBatchUpdate,
                    currentStyle,
                  })
                }
                tooltip={
                  <Tooltip
                    variant="wrapped"
                    content={
                      <Text>
                        Paste CSS code for a transition or part of a transition,
                        for example:
                        <br />
                        <br />
                        <Text variant="monoBold">{initialTransition}</Text>
                      </Text>
                    }
                  >
                    <InfoCircleIcon />
                  </Tooltip>
                }
              />
            );
          }}
        />
      )}
    </CollapsibleSectionRoot>
  );
};
