import { Flex, Grid } from "@webstudio-is/design-system";
import { toValue } from "@webstudio-is/css-engine";
import type { RenderCategoryProps } from "../../style-sections";
import { ToggleGroupControl } from "../../controls/toggle/toggle-control";
import { PropertyName } from "../../shared/property-name";
import { TextControl } from "../../controls";
import {
  CrossSmallIcon,
  AlignSelfStartIcon,
  AlignSelfEndIcon,
  AlignSelfCenterIcon,
  AlignSelfBaselineIcon,
  AlignSelfStretchIcon,
  FlexSizingShrinkIcon,
  FlexSizingGrowIcon,
  OrderFirstIcon,
  OrderLastIcon,
  EllipsesIcon,
} from "@webstudio-is/icons";
import { FloatingPanel } from "~/designer/shared/floating-panel";

export const FlexChildSection = (props: RenderCategoryProps) => {
  return (
    <Flex css={{ flexDirection: "column", gap: "$spacing$5" }}>
      <FlexChildSectionAlign {...props} />
      <FlexChildSectionSizing {...props} />
      <FlexChildSectionOrder {...props} />
    </Flex>
  );
};

const FlexChildSectionAlign = (props: RenderCategoryProps) => {
  const {
    setProperty,
    deleteProperty,
    currentStyle,
    setStyle,
    cascadedStyle,
    inheritedStyle,
    sectionStyle,
  } = props;
  const setAlignSelf = setProperty("alignSelf");

  return (
    <Grid css={{ gridTemplateColumns: "4fr auto" }}>
      <PropertyName
        property="alignSelf"
        label="Align"
        setStyle={setStyle}
        cascadedStyle={cascadedStyle}
        inheritedStyle={inheritedStyle}
        onReset={() => deleteProperty("alignSelf")}
      />
      <ToggleGroupControl
        property={sectionStyle.alignSelf?.styleConfig.property}
        onValueChange={(value) => setAlignSelf(value)}
        value={toValue(currentStyle.alignSelf)}
        items={[
          {
            child: <CrossSmallIcon />,
            label: "Do not align self",
            value: "auto",
          },
          {
            child: <AlignSelfStartIcon />,
            label: "align-self: flex-start",
            value: "start",
          },
          {
            child: <AlignSelfEndIcon />,
            label: "align-self: flex-end",
            value: "end",
          },
          {
            child: <AlignSelfCenterIcon />,
            label: "align-self: center",
            value: "center",
          },
          {
            child: <AlignSelfStretchIcon />,
            label: "align-self: stretch",
            value: "stretch",
          },
          {
            child: <AlignSelfBaselineIcon />,
            label: "align-self: baseline",
            value: "baseline",
          },
        ]}
      />
    </Grid>
  );
};

const FlexChildSectionSizing = (props: RenderCategoryProps) => {
  const {
    createBatchUpdate,
    currentStyle,
    setStyle,
    cascadedStyle,
    inheritedStyle,
    sectionStyle,
  } = props;
  const setSizing = createBatchUpdate();

  return (
    <Grid css={{ gridTemplateColumns: "4fr auto" }}>
      <PropertyName
        property={["flexGrow", "flexShrink"]}
        label="Sizing"
        setStyle={setStyle}
        cascadedStyle={cascadedStyle}
        inheritedStyle={inheritedStyle}
        onReset={() => {
          setSizing.deleteProperty("flexGrow");
          setSizing.deleteProperty("flexShrink");
          setSizing.publish();
        }}
      />
      <ToggleGroupControl
        property={[
          sectionStyle.flexGrow?.styleConfig.property,
          sectionStyle.flexShrink?.styleConfig.property,
        ]}
        onValueChange={(value) => {
          switch (value) {
            case "none": {
              setSizing.setProperty("flexGrow")("0");
              setSizing.setProperty("flexShrink")("0");
              setSizing.publish();
              break;
            }
            case "grow": {
              setSizing.setProperty("flexGrow")("1");
              setSizing.setProperty("flexShrink")("0");
              setSizing.publish();
              break;
            }
            case "shrink": {
              setSizing.setProperty("flexGrow")("0");
              setSizing.setProperty("flexShrink")("1");
              setSizing.publish();
              break;
            }
          }
        }}
        value={getSizingValue(
          toValue(currentStyle.flexGrow),
          toValue(currentStyle.flexShrink)
        )}
        items={[
          {
            child: <CrossSmallIcon />,
            label: "Don't grow or shrink",
            value: "none",
          },
          {
            child: <FlexSizingGrowIcon />,
            label: "Grow if possible",
            value: "grow",
          },
          {
            child: <FlexSizingShrinkIcon />,
            label: "Shrink if needed",
            value: "shrink",
          },
          {
            child: <FlexChildSectionSizingPopover {...props} />,
            label: "More sizing options",
            value: "",
          },
        ]}
      />
    </Grid>
  );
};

const FlexChildSectionSizingPopover = ({
  deleteProperty,
  sectionStyle,
  setStyle,
  cascadedStyle,
  inheritedStyle,
}: RenderCategoryProps) => {
  return (
    <FloatingPanel
      title="Sizing"
      content={
        <Grid
          css={{
            gridTemplateColumns: "1.5fr 1fr 1fr",
            gap: "$spacing$9",
            padding: "$spacing$9",
          }}
        >
          <Grid css={{ gridTemplateColumns: "auto", gap: "$spacing$3" }}>
            <PropertyName
              property="flexBasis"
              label="Basis"
              setStyle={setStyle}
              cascadedStyle={cascadedStyle}
              inheritedStyle={inheritedStyle}
              onReset={() => deleteProperty("flexBasis")}
            />
            <TextControl {...sectionStyle.flexBasis} />
          </Grid>
          <Grid css={{ gridTemplateColumns: "auto", gap: "$spacing$3" }}>
            <PropertyName
              property="flexGrow"
              label="Grow"
              setStyle={setStyle}
              cascadedStyle={cascadedStyle}
              inheritedStyle={inheritedStyle}
              onReset={() => deleteProperty("flexGrow")}
            />
            <TextControl {...sectionStyle.flexGrow} />
          </Grid>
          <Grid css={{ gridTemplateColumns: "auto", gap: "$spacing$3" }}>
            <PropertyName
              property="flexShrink"
              label="Shrink"
              setStyle={setStyle}
              cascadedStyle={cascadedStyle}
              inheritedStyle={inheritedStyle}
              onReset={() => deleteProperty("flexShrink")}
            />
            <TextControl {...sectionStyle.flexShrink} />
          </Grid>
        </Grid>
      }
    >
      <Flex>
        <EllipsesIcon />
      </Flex>
    </FloatingPanel>
  );
};

const FlexChildSectionOrder = (props: RenderCategoryProps) => {
  const {
    deleteProperty,
    setProperty,
    currentStyle,
    setStyle,
    cascadedStyle,
    inheritedStyle,
    sectionStyle,
  } = props;
  const setOrder = setProperty("order");

  return (
    <Grid css={{ gridTemplateColumns: "4fr auto" }}>
      <PropertyName
        property="order"
        label="Order"
        setStyle={setStyle}
        cascadedStyle={cascadedStyle}
        inheritedStyle={inheritedStyle}
        onReset={() => deleteProperty("order")}
      />
      <ToggleGroupControl
        property={sectionStyle.order?.styleConfig.property}
        onValueChange={(value) => {
          switch (value) {
            case "0":
            case "1":
            case "-1": {
              setOrder(value);
              break;
            }
          }
        }}
        value={toValue(currentStyle.order)}
        items={[
          {
            child: <CrossSmallIcon />,
            label: "Dont't change",
            value: "0",
          },
          {
            child: <OrderFirstIcon />,
            label: "Make first",
            value: "1",
          },
          {
            child: <OrderLastIcon />,
            label: "Make last",
            value: "-1",
          },
          {
            child: <FlexChildSectionOrderPopover {...props} />,
            label: "Customize order",
            value: "",
          },
        ]}
      />
    </Grid>
  );
};

const FlexChildSectionOrderPopover = (props: RenderCategoryProps) => {
  const {
    deleteProperty,
    sectionStyle,
    setStyle,
    cascadedStyle,
    inheritedStyle,
  } = props;
  return (
    <FloatingPanel
      title="Order"
      content={
        <Grid css={{ padding: "$spacing$9" }}>
          <Grid css={{ gridTemplateColumns: "4fr 6fr" }}>
            <PropertyName
              property="order"
              label="Order"
              setStyle={setStyle}
              cascadedStyle={cascadedStyle}
              inheritedStyle={inheritedStyle}
              onReset={() => deleteProperty("order")}
            />
            <TextControl {...sectionStyle.order} />
          </Grid>
        </Grid>
      }
    >
      <Flex>
        <EllipsesIcon />
      </Flex>
    </FloatingPanel>
  );
};

const getSizingValue = (flexGrow: string, flexShrink: string) => {
  if (flexGrow === "0" && flexShrink === "0") {
    return "none";
  }
  if (flexGrow === "1" && flexShrink === "0") {
    return "grow";
  }
  if (flexGrow === "0" && flexShrink === "1") {
    return "shrink";
  }
  return "";
};
