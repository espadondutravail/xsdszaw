import type {
  KeywordValue,
  LayerValueItem,
  LayersValue,
  TupleValue,
  UnitValue,
} from "@webstudio-is/css-engine";
import type { StyleInfo } from "../../shared/style-info";
import type {
  CreateBatchUpdate,
  StyleUpdateOptions,
} from "../../shared/use-style-data";
import {
  extractTransitionProperties,
  parseTransition,
} from "@webstudio-is/css-data";

export const initialTransition = "opacity 200ms ease 0s";
export const defaultTransitionProperty: KeywordValue = {
  type: "keyword",
  value: "opacity",
};
export const defaultTransitionDuration: UnitValue = {
  type: "unit",
  value: 0,
  unit: "ms",
};
export const defaultTransitionDelay: UnitValue = {
  type: "unit",
  value: 0,
  unit: "ms",
};
export const defaultTransitionTimingFunction: KeywordValue = {
  type: "keyword",
  value: "ease",
};

export const defaultFunctions = {
  linear: "linear",
  ease: "ease",
  "ease in": "ease-in",
  "ease out": "ease-out",
  "ease-in-out": "ease-in-out",
} as const;

export const easeInFunctions = {
  "ease-in-sine": "cubic-bezier(0.12,0,0.39,0)",
  "ease-in-quad": "cubic-bezier(0.11,0,0.5,0)",
  "ease-in-cubic": "cubic-bezier(0.32,0,0.67,0)",
  "ease-in-quart": "cubic-bezier(0.5,0,0.75,0)",
  "ease-in-quint": "cubic-bezier(0.64,0,0.78,0)",
  "ease-in-expo": "cubic-bezier(0.7,0,0.84,0)",
  "ease-in-circ": "cubic-bezier(0.55,0,1,0.45)",
  "ease-in-back": "cubic-bezier(0.36,0,0.66,-0.56)",
} as const;

export const easeOutFunctions = {
  "ease-out-sine": "cubic-bezier(0.61,1,0.88,1)",
  "ease-out-quad": "cubic-bezier(0.5,1,0.89,1)",
  "ease-out-cubic": "cubic-bezier(0.33,1,0.68,1)",
  "ease-out-quart": "cubic-bezier(0.25,1,0.5,1)",
  "ease-out-quint": "cubic-bezier(0.22,1,0.36,1)",
  "ease-out-expo": "cubic-bezier(0.16,1,0.3,1)",
  "ease-out-circ": "cubic-bezier(0,0.55,0.45,1)",
  "ease-out-back": "cubic-bezier(0.34,1.56,0.64,1)",
} as const;

export const easeInOutFunctions = {
  "ease-in-out-sine": "cubic-bezier(0.37,0,0.63,1)",
  "ease-in-out-quad": "cubic-bezier(0.45,0,0.55,1)",
  "ease-in-out-cubic": "cubic-bezier(0.65,0,0.35,1)",
  "ease-in-out-quart": "cubic-bezier(0.76,0,0.24,1)",
  "ease-in-out-quint": "cubic-bezier(0.83,0,0.17,1)",
  "ease-in-out-expo": "cubic-bezier(0.87,0,0.13,1)",
  "ease-in-out-circ": "cubic-bezier(0.85,0,0.15,1)",
  "ease-in-out-back": "cubic-bezier(0.68,-0.6,0.32,1.6)",
} as const;

export const timingFunctions = {
  ...defaultFunctions,
  ...easeInFunctions,
  ...easeOutFunctions,
  ...easeInOutFunctions,
} as const;

export type DefaultFunction = keyof typeof defaultFunctions;
export type EaseInFunction = keyof typeof easeInFunctions;
export type EaseOutFunction = keyof typeof easeOutFunctions;
export type EaseInOutFunction = keyof typeof easeInOutFunctions;
export type TimingFunctions =
  | DefaultFunction
  | EaseInFunction
  | EaseOutFunction
  | EaseInOutFunction;

export const findTimingFunctionFromValue = (
  timingFunction: string
): TimingFunctions | undefined => {
  return (Object.keys(timingFunctions) as TimingFunctions[]).find(
    (key: TimingFunctions) => timingFunctions[key] === timingFunction
  );
};

export const transitionProperties = [
  "transitionProperty",
  "transitionTimingFunction",
  "transitionDelay",
  "transitionDuration",
] as const;

export type TransitionProperties = (typeof transitionProperties)[number];

export const getTransitionProperties = (
  currentyStyle: StyleInfo
): Record<TransitionProperties, LayersValue> => {
  const properties: Record<TransitionProperties, LayersValue> = {
    transitionProperty: { type: "layers", value: [] },
    transitionTimingFunction: { type: "layers", value: [] },
    transitionDelay: { type: "layers", value: [] },
    transitionDuration: { type: "layers", value: [] },
  };
  for (const property of transitionProperties) {
    const value = currentyStyle[property];
    if (value !== undefined && value.value.type === "layers") {
      properties[property] = value.value;
    }
  }

  return properties;
};

const isValidTransitionValue = (
  value: LayerValueItem
): value is KeywordValue => {
  return value.type === "keyword" || value.type === "unit";
};

export const convertIndividualTransitionToLayers = (
  properties: Record<TransitionProperties, LayersValue>
) => {
  const layers: { type: "layers"; value: Array<TupleValue> } = {
    type: "layers",
    value: [],
  };
  const {
    transitionProperty,
    transitionDuration,
    transitionDelay,
    transitionTimingFunction,
  } = properties;

  for (const [index] of transitionProperty.value.entries()) {
    const property = transitionProperty.value[index];
    const duration = transitionDuration.value[index];
    const timingFunction = transitionTimingFunction.value[index];
    const delay = transitionDelay.value[index];

    if (
      isValidTransitionValue(property) === true &&
      isValidTransitionValue(duration) === true &&
      isValidTransitionValue(timingFunction) === true &&
      isValidTransitionValue(delay) === true
    ) {
      const layer: TupleValue = {
        type: "tuple",
        value: [property, duration, timingFunction, delay],
        hidden: property.hidden ? true : false,
      };
      layers.value.push(layer);
    }
  }

  return layers;
};

export const deleteTransitionProperties = (props: {
  createBatchUpdate: CreateBatchUpdate;
}) => {
  const batch = props.createBatchUpdate();
  transitionProperties.forEach((property) => {
    batch.deleteProperty(property);
  });
  batch.publish();
};

export const addDefaultTransitionLayer = (props: {
  createBatchUpdate: CreateBatchUpdate;
  currentStyle: StyleInfo;
}) => {
  const { createBatchUpdate, currentStyle } = props;
  const properties = getTransitionProperties(currentStyle);
  const { timing, property, delay, duration } = extractTransitionProperties(
    parseTransition(initialTransition).value[0] as TupleValue
  );
  const batch = createBatchUpdate();

  if (property) {
    batch.setProperty("transitionProperty")({
      type: "layers",
      value: [...properties.transitionProperty.value, property],
    });
  }

  if (timing) {
    batch.setProperty("transitionTimingFunction")({
      type: "layers",
      value: [...properties.transitionTimingFunction.value, timing],
    });
  }

  if (duration) {
    batch.setProperty("transitionDuration")({
      type: "layers",
      value: [...properties.transitionDuration.value, duration],
    });
  }

  if (delay) {
    batch.setProperty("transitionDelay")({
      type: "layers",
      value: [...properties.transitionDelay.value, delay],
    });
  }

  batch.publish();
};

export const deleteTransitionLayer = (props: {
  index: number;
  createBatchUpdate: CreateBatchUpdate;
  currentStyle: StyleInfo;
}) => {
  const { index, createBatchUpdate, currentStyle } = props;

  const properties = getTransitionProperties(currentStyle);
  const batch = createBatchUpdate();
  transitionProperties.forEach((property) => {
    const value = properties[property].value;
    batch.setProperty(property)({
      type: "layers",
      value: value.filter((_, i) => i !== index),
    });
  });
  batch.publish();
};

export const editTransitionLayer = (props: {
  index: number;
  layer: LayersValue;
  options: StyleUpdateOptions;
  currentStyle: StyleInfo;
  createBatchUpdate: CreateBatchUpdate;
}) => {
  const { index, layer, createBatchUpdate, options, currentStyle } = props;
  if (layer.value[0].type !== "tuple") {
    return;
  }
  const properties = getTransitionProperties(currentStyle);

  const batch = createBatchUpdate();

  const {
    property,
    duration = defaultTransitionDuration,
    timing = defaultTransitionTimingFunction,
    delay = defaultTransitionDelay,
  } = extractTransitionProperties(layer.value[0]);
  const {
    transitionProperty,
    transitionDelay,
    transitionDuration,
    transitionTimingFunction,
  } = properties;

  // transition-property can't be undefined
  if (property === undefined) {
    return;
  }

  const newProperty = [...transitionProperty.value];
  newProperty.splice(index, 1, property);
  batch.setProperty("transitionProperty")({
    type: "layers",
    value: newProperty,
  });

  const newDuration = [...transitionDuration.value];
  newDuration.splice(index, 1, duration);
  batch.setProperty("transitionDuration")({
    type: "layers",
    value: newDuration,
  });

  const newTiming = [...transitionTimingFunction.value];
  newTiming.splice(index, 1, timing);
  batch.setProperty("transitionTimingFunction")({
    type: "layers",
    value: newTiming,
  });

  const newDelay = [...transitionDelay.value];
  newDelay.splice(index, 1, delay);
  batch.setProperty("transitionDelay")({
    type: "layers",
    value: newDelay,
  });

  batch.publish(options);
};

export const swapTransitionLayers = (props: {
  oldIndex: number;
  newIndex: number;
  createBatchUpdate: CreateBatchUpdate;
  currentStyle: StyleInfo;
}) => {
  const { oldIndex, newIndex, createBatchUpdate, currentStyle } = props;
  const properties = getTransitionProperties(currentStyle);
  const batch = createBatchUpdate();

  for (const property of transitionProperties) {
    const layer = properties[property];
    const layervalue = [...layer.value];
    layervalue.splice(oldIndex, 1);
    layervalue.splice(newIndex, 0, layer.value[oldIndex]);
    batch.setProperty(property)({
      ...layer,
      value: layervalue,
    });
  }

  batch.publish();
};

export const hideTransitionLayer = (props: {
  index: number;
  createBatchUpdate: CreateBatchUpdate;
  currentStyle: StyleInfo;
}) => {
  const { createBatchUpdate, index, currentStyle } = props;
  const properties = getTransitionProperties(currentStyle);
  const batch = createBatchUpdate();

  for (const property of transitionProperties) {
    const propertyLayer = properties[property];
    batch.setProperty(property)({
      type: "layers",
      value: propertyLayer.value.map((layer, i) => {
        if (layer.type !== "keyword" && layer.type !== "unit") {
          return layer;
        }

        return i === index
          ? { ...layer, hidden: layer.hidden ? false : true }
          : layer;
      }),
    });
  }

  batch.publish();
};
