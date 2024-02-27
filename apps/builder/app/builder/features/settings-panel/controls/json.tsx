import { useStore } from "@nanostores/react";
import { isLiteralExpression } from "@webstudio-is/react-sdk";
import {
  type ControlProps,
  getLabel,
  useLocalValue,
  VerticalLayout,
  Label,
  updateExpressionValue,
  $selectedInstanceScope,
  useBindingState,
} from "../shared";
import {
  ExpressionEditor,
  formatValue,
} from "~/builder/shared/expression-editor";
import {
  BindingControl,
  BindingPopover,
} from "~/builder/shared/binding-popover";
import { useState } from "react";

export const JsonControl = ({
  meta,
  prop,
  propName,
  computedValue,
  deletable,
  onChange,
  onDelete,
}: ControlProps<"json">) => {
  const [error, setError] = useState<undefined | string>(undefined);
  const valueString = formatValue(computedValue ?? "");
  const localValue = useLocalValue(valueString, (value) => {
    // prevent executing expressions which depends on global variables
    if (isLiteralExpression(value) === false) {
      setError("color");
      return;
    }
    setError(undefined);
    try {
      // wrap into parens to treat object expression as value instead of block
      const parsedValue = eval(`(${value})`);
      if (prop?.type === "expression") {
        updateExpressionValue(prop.value, parsedValue);
      } else {
        onChange({ type: "json", value: parsedValue });
      }
    } catch {
      // empty block
    }
  });
  const label = getLabel(meta, propName);

  const { scope, aliases } = useStore($selectedInstanceScope);
  const expression = prop?.type === "expression" ? prop.value : valueString;
  const { overwritable, variant } = useBindingState(
    prop?.type === "expression" ? prop.value : undefined
  );

  return (
    <VerticalLayout
      label={
        <Label description={meta.description} readOnly={overwritable === false}>
          {label}
        </Label>
      }
      deletable={deletable}
      onDelete={onDelete}
    >
      <BindingControl>
        <ExpressionEditor
          color={error ? "error" : undefined}
          readOnly={overwritable === false}
          value={localValue.value}
          onChange={localValue.set}
          onBlur={localValue.save}
        />
        <BindingPopover
          scope={scope}
          aliases={aliases}
          variant={variant}
          value={expression}
          onChange={(newExpression) =>
            onChange({ type: "expression", value: newExpression })
          }
          onRemove={(evaluatedValue) =>
            onChange({ type: "json", value: evaluatedValue })
          }
        />
      </BindingControl>
    </VerticalLayout>
  );
};
