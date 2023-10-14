import { z } from "zod";
import {
  copywriter,
  operations,
  handleAiRequest,
  commandDetect,
} from "@webstudio-is/ai";
import { createCssEngine } from "@webstudio-is/css-engine";
import {
  generateJsxElement,
  generateJsxChildren,
  getIndexesWithinAncestors,
  getStyleRules,
  idAttribute,
  componentAttribute,
} from "@webstudio-is/react-sdk";
import { createScope, findTreeInstanceIds } from "@webstudio-is/sdk";
import { computed } from "nanostores";
import { getMapValuesByKeysSet } from "~/shared/array-utils";
import {
  breakpointsStore,
  dataSourcesStore,
  instancesStore,
  projectStore,
  propsStore,
  registeredComponentMetasStore,
  selectedInstanceSelectorStore,
  styleSourceSelectionsStore,
  stylesStore,
} from "~/shared/nano-states";
import { applyOperations, patchTextInstance } from "./apply-operations";
import { restAi } from "~/shared/router-utils";
import untruncateJson from "untruncate-json";
import { traverseTemplate } from "@webstudio-is/jsx-utils";
import { RequestParamsSchema } from "~/routes/rest.ai._index";
import {
  AiApiException,
  RateLimitException,
  textToRateLimitMeta,
} from "./api-exceptions";

const unknownArray = z.array(z.unknown());

export const fetchResult = async (
  prompt: string,
  abortSignal: AbortSignal
): Promise<void> => {
  const commandsResponse = await handleAiRequest<commandDetect.Response>(
    fetch(restAi("detect"), {
      method: "POST",
      body: JSON.stringify({ prompt }),
      signal: abortSignal,
    }),
    {
      onResponseReceived: async (response) => {
        if (response.ok === false) {
          const text = await response.text();

          if (response.status === 429) {
            const meta = textToRateLimitMeta(text);
            throw new RateLimitException(text, meta);
          }

          throw new Error(
            `Fetch error status=${response.status} text=${text.slice(0, 1000)}`
          );
        }
      },
    }
  );

  if (commandsResponse.type === "stream") {
    throw new Error(
      "Commands detection is not using streaming. Something went wrong."
    );
  }

  if (commandsResponse.success === false) {
    // Server error response
    throw new Error(commandsResponse.data.message);
  }

  const project = projectStore.get();
  const selectedInstanceSelector = selectedInstanceSelectorStore.get();
  const availableComponentsNames = $availableComponentsNames.get();
  const [styles, jsx] = $jsx.get() || ["", ""];

  const requestParams = {
    jsx: `${styles}${jsx}`,
    components: availableComponentsNames,
    projectId: project?.id,
    instanceId: selectedInstanceSelector?.[0],
    prompt,
  };

  // @todo Future commands might not require all the requestParams above.
  // When that will be the case, we should revisit the validatin below.
  if (requestParams.instanceId === undefined) {
    throw new Error("Please select an instance on the canvas.");
  }

  // @todo can be covered by ts
  if (
    RequestParamsSchema.omit({ command: true }).safeParse(requestParams)
      .success === false
  ) {
    throw new Error("Invalid prompt data");
  }

  const appliedOperations = new Set<string>();

  const promises = await Promise.allSettled(
    commandsResponse.data.map((command) =>
      handleAiRequest<operations.Response>(
        fetch(restAi(), {
          method: "POST",
          body: JSON.stringify({
            ...requestParams,
            command,
            jsx:
              // Delete instances don't need CSS.
              command === operations.deleteInstanceName
                ? jsx
                : requestParams.jsx,
            // @todo This helps the operations chain disambiguating operation detection.
            // Ideally though the operations chain can be executed just for one
            // specific kind of operation i.e. `command`.
            prompt: `${command}:\n\n${requestParams.prompt}`,
          }),
          signal: abortSignal,
        }),
        {
          onResponseReceived: async (response) => {
            if (response.ok === false) {
              const text = await response.text();

              if (response.status === 429) {
                const meta = textToRateLimitMeta(text);
                throw new RateLimitException(text, meta);
              }

              throw new Error(
                `Fetch error status=${response.status} text=${text.slice(
                  0,
                  1000
                )}`
              );
            }
          },
          onChunk: (operationId, { completion }) => {
            if (operationId === "copywriter") {
              try {
                const unparsedDataArray = unknownArray.parse(
                  JSON.parse(untruncateJson(completion))
                );

                const parsedDataArray = unparsedDataArray
                  .map((item) => {
                    const safeResult =
                      copywriter.TextInstanceSchema.safeParse(item);
                    if (safeResult.success) {
                      return safeResult.data;
                    }
                  })
                  .filter(
                    <T>(value: T): value is NonNullable<T> =>
                      value !== undefined
                  );

                const operationsToApply = parsedDataArray.filter(
                  (item) =>
                    appliedOperations.has(JSON.stringify(item)) === false
                );

                for (const operation of operationsToApply) {
                  patchTextInstance(operation);
                  appliedOperations.add(JSON.stringify(operation));
                }
              } catch {
                // eslint-disable-next-line no-console
                console.error("completion failed to parse", completion);
              }
            }
          },
        }
      )
    )
  );

  for (const promise of promises) {
    if (promise.status === "fulfilled") {
      const result = promise.value;

      if (result.success === false) {
        throw new AiApiException(result.data.message);
      }

      if (result.type !== "json") {
        continue;
      }

      if (result.id === "operations") {
        restoreComponentsNamespace(result.data);
        applyOperations(result.data);
        continue;
      }

      // Handle other commands responses below.
      // ...
      //
    } else if (promise.status === "rejected") {
      throw new Error(promise.reason.message);
    }
  }
};

const $availableComponentsNames = computed(
  [registeredComponentMetasStore],
  (metas) => {
    const exclude = ["Body", "Slot"];

    return [...metas.keys()]
      .filter((name) => !exclude.includes(name))
      .map(parseComponentName);
  }
);

// The LLM gets a list of available component names
// therefore we need to replace the component namespace with a LLM-friendly one
// preserving context eg. Radix.Dialog instead of just Dialog
const parseComponentName = (name: string) =>
  name.replace("@webstudio-is/sdk-components-react-radix:", "Radix.");
// When AI generation is done we need to restore components namespaces.
const restoreComponentsNamespace = (operations: operations.WsOperations) => {
  for (const operation of operations) {
    if (operation.operation === "insertTemplate") {
      traverseTemplate(operation.template, (node) => {
        if (node.type === "instance" && node.component.startsWith("Radix.")) {
          node.component =
            "@webstudio-is/sdk-components-react-radix:" +
            node.component.slice("Radix.".length);
        }
      });
    }
  }
};

const $jsx = computed(
  [
    selectedInstanceSelectorStore,
    instancesStore,
    propsStore,
    dataSourcesStore,
    registeredComponentMetasStore,
    breakpointsStore,
    stylesStore,
    styleSourceSelectionsStore,
  ],
  (
    selectedInstanceSelector,
    instances,
    props,
    dataSources,
    metas,
    breakpoints,
    styles,
    styleSourceSelections
  ) => {
    if (selectedInstanceSelector === undefined) {
      return;
    }

    const [rootInstanceId] = selectedInstanceSelector;
    const instance = instances.get(rootInstanceId);
    if (instance === undefined) {
      return;
    }
    const indexesWithinAncestors = getIndexesWithinAncestors(metas, instances, [
      rootInstanceId,
    ]);
    const scope = createScope();

    const jsx = generateJsxElement({
      scope,
      instance,
      props,
      dataSources,
      indexesWithinAncestors,
      children: generateJsxChildren({
        scope,
        children: instance.children,
        instances,
        props,
        dataSources,
        indexesWithinAncestors,
      }),
    });

    const treeInstanceIds = findTreeInstanceIds(instances, rootInstanceId);

    const treeStyleSourceSelections = new Map(
      getMapValuesByKeysSet(styleSourceSelections, treeInstanceIds).map(
        (styleSourceSelection) => [
          styleSourceSelection.instanceId,
          styleSourceSelection,
        ]
      )
    );

    const engine = createCssEngine({ name: "ssr" });

    const styleRules = getStyleRules(styles, treeStyleSourceSelections);
    for (const { breakpointId, instanceId, state, style } of styleRules) {
      engine.addStyleRule(`[${idAttribute}="${instanceId}"]${state ?? ""}`, {
        breakpoint: breakpointId,
        style,
      });
    }

    const css = engine.cssText.replace(/\n/gm, " ");
    return [
      css.length > 0 ? `<style>{\`${css}\`}</style>` : "",
      jsx
        .replace(new RegExp(`${componentAttribute}="[^"]+"`, "g"), "")
        .replace(/\n(data-)/g, " $1"),
    ];
  }
);

/*
export const fetchResult = async (text: string) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${restAi()}/blabla`, {
    method: "POST",
    body: formData,
  });

  if (response.ok === false) {
    // @todo: show error
    return;
  }

  // @todo add response parsing
  const { text } = await response.json();

  // return text;
  await new Promise((resolve) => setTimeout(resolve, 10000));
};
*/
