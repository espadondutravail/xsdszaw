import { z } from "zod";

const Attr = z.object({ id: z.string() }).partial();

const WfNodeData = z.object({
  attr: Attr.optional(),
  xattr: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

const WfBaseNode = z.object({
  _id: z.string(),
  tag: z.string(),
  children: z.array(z.string()),
  classes: z.array(z.string()),
  data: WfNodeData.optional(),
  attr: Attr.optional(),
});

const WfTextNode = z.object({
  _id: z.string(),
  v: z.string(),
  text: z.boolean(),
});

export const wfNodeTypes = [
  "Heading",
  "Block",
  "List",
  "ListItem",
  "Link",
  "Paragraph",
  "Blockquote",
  "RichText",
  "Strong",
  "Emphasized",
  "Superscript",
  "Subscript",
  "Section",
  "BlockContainer",
  "Layout",
  "Cell",
  "VFlex",
  "HFlex",
  "Grid",
  "Row",
  "Column",
  "CodeBlock",
  "HtmlEmbed",
  "Image",
  "FormWrapper",
  "FormForm",
  "FormSuccessMessage",
  "FormErrorMessage",
  "FormButton",
  "FormTextInput",
  "FormBlockLabel",
] as const;

export const WfElementNode = z.union([
  WfBaseNode.extend({ type: z.enum(["Heading"]) }),
  WfBaseNode.extend({
    type: z.enum(["Block"]),
    data: WfNodeData.extend({
      attr: Attr.optional(),
      text: z.boolean().optional(),
    }).optional(),
  }),
  WfBaseNode.extend({ type: z.enum(["List"]) }),
  WfBaseNode.extend({ type: z.enum(["ListItem"]) }),
  WfBaseNode.extend({
    type: z.enum(["Link"]),
    data: WfNodeData.extend({
      attr: Attr.optional(),
      block: z.enum(["inline", "block", ""]).optional(),
      button: z.boolean().optional(),
      link: z.object({
        url: z.string(),
        target: z.string().optional(),
      }),
    }),
  }),
  WfBaseNode.extend({ type: z.enum(["Paragraph"]) }),
  WfBaseNode.extend({ type: z.enum(["Blockquote"]) }),
  WfBaseNode.extend({ type: z.enum(["RichText"]) }),
  WfBaseNode.extend({ type: z.enum(["Strong"]) }),
  WfBaseNode.extend({ type: z.enum(["Emphasized"]) }),
  WfBaseNode.extend({ type: z.enum(["Superscript"]) }),
  WfBaseNode.extend({ type: z.enum(["Subscript"]) }),
  WfBaseNode.extend({ type: z.enum(["Section"]) }),
  WfBaseNode.extend({ type: z.enum(["BlockContainer"]) }),
  WfBaseNode.extend({ type: z.enum(["Layout"]) }),
  WfBaseNode.extend({ type: z.enum(["Cell"]) }),
  WfBaseNode.extend({ type: z.enum(["VFlex"]) }),
  WfBaseNode.extend({ type: z.enum(["HFlex"]) }),
  WfBaseNode.extend({ type: z.enum(["Grid"]) }),
  WfBaseNode.extend({ type: z.enum(["Row"]) }),
  WfBaseNode.extend({ type: z.enum(["Column"]) }),
  WfBaseNode.extend({
    type: z.enum(["CodeBlock"]),
    data: WfNodeData.extend({
      attr: Attr.optional(),
      language: z.string().optional(),
      code: z.string(),
    }),
  }),
  WfBaseNode.extend({
    type: z.enum(["HtmlEmbed"]),
    v: z.string(),
  }),
  WfBaseNode.extend({
    type: z.enum(["Image"]),
    data: WfNodeData.extend({
      attr: Attr.extend({
        alt: z.string(),
        loading: z.enum(["lazy", "eager", "auto"]),
        src: z.string(),
        width: z.string(),
        height: z.string(),
      }),
    }),
  }),
  WfBaseNode.extend({ type: z.enum(["FormWrapper"]) }),
  WfBaseNode.extend({
    type: z.enum(["FormForm"]),
    data: WfNodeData.extend({
      attr: Attr.extend({
        action: z.string(),
        method: z.string(),
        name: z.string(),
      }),
    }),
  }),
  WfBaseNode.extend({ type: z.enum(["FormSuccessMessage"]) }),
  WfBaseNode.extend({ type: z.enum(["FormErrorMessage"]) }),
  WfBaseNode.extend({
    type: z.enum(["FormButton"]),
    data: WfNodeData.extend({
      attr: Attr.extend({
        value: z.string(),
      }),
    }),
  }),
  WfBaseNode.extend({
    type: z.enum(["FormTextInput"]),
    data: WfNodeData.extend({
      attr: Attr.extend({
        id: z.string(),
        name: z.string(),
        maxlength: z.number(),
        placeholder: z.string(),
        disabled: z.boolean(),
        type: z.string(),
        required: z.boolean(),
        autofocus: z.boolean(),
      }),
    }),
  }),
  WfBaseNode.extend({
    type: z.enum(["FormBlockLabel"]),
    data: WfNodeData.extend({
      attr: Attr.extend({
        for: z.string().optional(),
      }),
    }),
  }),
]);

export type WfElementNode = z.infer<typeof WfElementNode>;

[...wfNodeTypes] as const satisfies WfElementNode["type"][];

//@todo verify the other way around too
//(typeof WfElementNode)["type"] satisfies typeof wfNodeTypes[number]

export const WfNode = z.union([WfElementNode, WfTextNode]);
export type WfNode = z.infer<typeof WfNode>;

export const WfStyle = z.object({
  _id: z.string(),
  type: z.enum(["class"]),
  name: z.string(),
  styleLess: z.string(),
  fake: z.boolean().optional(),
  comb: z.string().optional(),
  namespace: z.string().optional(),
  variants: z
    .object({
      large: z.object({ styleLess: z.string() }).optional(),
      medium: z.object({ styleLess: z.string() }).optional(),
      small: z.object({ styleLess: z.string() }).optional(),
      tiny: z.object({ styleLess: z.string() }).optional(),
      xl: z.object({ styleLess: z.string() }).optional(),
      xxl: z.object({ styleLess: z.string() }).optional(),
    })
    .optional(),
  children: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  origin: z.null().optional(),
  selector: z.null().optional(),
});
export type WfStyle = z.infer<typeof WfStyle>;

export const WfData = z.object({
  type: z.literal("@webflow/XscpData"),
  payload: z.object({
    // Using WfBaseNode here just so we can skip a node with unknown node.type.
    nodes: z.array(z.union([WfNode, WfBaseNode])),
    styles: z.array(WfStyle),
  }),
});
export type WfData = z.infer<typeof WfData>;
