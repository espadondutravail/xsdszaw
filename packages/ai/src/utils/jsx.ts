import {
  parseJsx,
  type MitosisComponent,
  type MitosisNode,
} from "@builder.io/mitosis";
import {
  StyleValue,
  parseCss,
  parseCssDecl,
  type StyleProperty,
} from "@webstudio-is/css-data";
import type { PropsList } from "@webstudio-is/project-build";
import type {
  EmbedTemplateStyleDecl,
  WsEmbedTemplate,
} from "@webstudio-is/react-sdk";
import json5 from "json5";
import { traverseTemplate } from "./traverse-template";

export const jsxToWSEmbedTemplate = (
  jsx: string,
  options = { parseStyles: true }
) => {
  const parsed = parseJsx(
    `export default function App() {\n return <Fragment>${jsx}</Fragment>\n}`,
    {
      typescript: false,
    }
  );

  const styles: string[] = [];

  const parseStyles = function parseStyles(node: ProcessedValue) {
    if (node && typeof node.type === "string" && node.type === "styles") {
      styles.push(node.value);
      // delete style nodes
      return null;
    }
    return node;
  };

  const json = JSON.parse(
    mitosisJSONToWsEmbedTemplate(
      options.parseStyles ? { onNode: parseStyles } : undefined
    )({ component: parsed })
  ) as WsEmbedTemplate;

  if (styles.length > 0) {
    const styleDecls = parseCss(styles.join("\n"));

    traverseTemplate(json, (node) => {
      if (node.type === "instance") {
        if (node.styles) {
          node.styles = node.styles
            .flatMap((style) => {
              const className = style.property;
              return styleDecls[className];
            })
            .filter(Boolean);
        }
      }
    });
  }

  return json[0].type === "instance" && json[0].component === "Fragment"
    ? json[0].children
    : json;
};

type ProcessedValue = ReturnType<typeof processValue>;
const createReplacer = function createReplacer(
  onNode: (node: ProcessedValue) => ProcessedValue | null = (node) => node
) {
  function replacer<U>(key: string, value: U): ProcessedValue[];
  function replacer(key: "children", value: MitosisNode[]): ProcessedValue[];
  // eslint-disable-next-line func-style
  function replacer(key: string, value: MitosisNode[]): ProcessedValue[] {
    if (key === "children" && Array.isArray(value)) {
      return value.map(processValue).filter((v) => onNode(v) !== null);
    }

    if (key !== null && Array.isArray(value)) {
      return value.map(processValue).filter((v) => onNode(v) !== null);
    }

    return value;
  }

  return replacer;
};

// @todo this is a Mitosis generator - add plugins hooks etc.
export const mitosisJSONToWsEmbedTemplate = function componentToWsEmbedTemplate(
  options = { onNode: (node: ProcessedValue) => node }
) {
  return ({ component }: { component: MitosisComponent }) => {
    return JSON.stringify(
      component.children.length === 1 &&
        component.children[0].name === "Fragment"
        ? component.children[0].children
        : component.children,
      createReplacer(options.onNode)
    );
  };
};

const processValue = function processValue(value: MitosisNode) {
  if (typeof value?.properties?._text === "string") {
    const text = value.properties._text.trim();
    if (text.length === 0) {
      return null;
    }

    return {
      type: "text",
      value: text,
    };
  }

  const type = value["@type"];

  if (type === "@builder.io/mitosis/node") {
    if (value.name === "style") {
      const styles = value.children
        .filter((child) => child.bindings._text?.code)
        .map((child) => child.bindings._text?.code)
        .join("\n");
      return {
        type: "styles",
        value: styles,
      };
    }
    const { class: className, ...props } = value.properties;
    // const styles = typeof className === "string"
    //   ? className.split(" ").map((name) => ({
    //       property: name,
    //       value: {
    //         type: "invalid",
    //         value: name,
    //       },
    //     }))
    //   : []
    let styles: EmbedTemplateStyleDecl[] = [];

    const bindings = Object.fromEntries(
      Object.entries(value.bindings).map(([key, value]) => {
        try {
          return [key, json5.parse(value.code)];
        } catch (error) {
          return [key, value];
        }
      })
    );

    if (bindings.style) {
      // @todo Replace `eval` with json5.parse or something
      const code = bindings.style;
      const component = value.name;
      delete bindings.style;

      styles = Object.entries(code).flatMap(([property, value]) => {
        const parsedStyles: EmbedTemplateStyleDecl[] = [];

        (
          Object.entries(
            parseCssDecl(
              property,
              typeof value === "number" &&
                unitlessNumbers.has(property) === false
                ? `${value}px`
                : value
            )
          ) as [StyleProperty, StyleValue][]
        ).forEach(([property, value]) => {
          try {
            StyleValue.parse(value);
            parsedStyles.push({
              property,
              value,
            });
          } catch (error) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.warn(
                true,
                `Declaration parsing for \`${component}.${property}: ${JSON.stringify(
                  value
                )}\` failed`
              );
            }
          }
        });

        return parsedStyles;
      });
    }

    return {
      type: "instance",
      component: value.name === "div" ? "Box" : value.name,
      props: getProps({ ...props, ...bindings }),
      styles,
      children: value.children || [],
    };
  }

  return value;
};

const getProps = function getProps(props: MitosisNode["properties"]) {
  const p: PropsList = [];
  Object.entries(props).forEach(([prop, value]) => {
    if (prop === "alt") {
      p.push({ type: "string", name: "alt", value });
    }
    if (prop === "variants") {
      p.push({ type: "string[]", name: "variants", value });
    }
  });
  return p;
};

const unitlessNumbers = new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "flex",
  "flexGrow",
  "flexOrder",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "fontWeight",
  "gridRow",
  "gridRowEnd",
  "gridRowGap",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnGap",
  "gridColumnStart",
  "lineClamp",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "shadowOpacity",
]);
