export const prompt = `You are a designer and the client came to you with the following request:

\`\`\`
{request}
\`\`\`

Your task is to be very creative and do the following:

- Infer a beautiful theme for the request: we will use in the final designs. Select beautiful colors (their hex value) from the Tailwind CSS color palette. Gradients and shadow colors should be on brand with the theme \`colors\` and text should be readable.
- Determine whether the design should be in light or dark mode

Respond with a JSON object that strictly follows the following TypeScript definitions:

\`\`\`typescript
type RgbaColor = string;
type Theme = {
  colorMode: "light" | "dark";
  theme: {
    background: {
      base: HexColor;
      accent: HexColor;
      secondary: HexColor;
      subtle: HexColor;
      input: HexColor;
    };
    foreground: {
      base: HexColor;
      accent: HexColor;
      secondary: HexColor;
      subtle: HexColor;
      input: HexColor;
    };
    gradients: [
      [HexColor, HexColor],
      [HexColor, HexColor],
      [HexColor, HexColor]
    ];
    fontFamily: {
      // generally a simple sans-serif or system-ui font
      base: FontName;
      // generally a simple sans-serif or system-ui font
      headings: FontName;
    };
    shadowsColors: [RgbaColor, RgbaColor, RgbaColor, RgbaColor];
  };
};
\`\`\`

Don't add any comment to the code.

Respond with a valid JSON code block. Start with \`\`\`json
`;
