import fs from "fs";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const inputPath = "src/app/styles.css";
const outputPath = "src/app/globals.css";

const baseCss = `
@import "tailwindcss";

:root {
  --background: #030712;
  --foreground: #f8fafc;
}

body {
  background: var(--background);
  color: var(--foreground);
  overflow-x: hidden;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

/* Custom sleek scrollbar for customizer and menus */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}

::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 1);
}
`;

fs.writeFileSync(inputPath, baseCss, "utf8");

const result = await postcss([tailwind()]).process(baseCss, {
  from: inputPath,
  to: outputPath,
});

fs.writeFileSync(outputPath, result.css, "utf8");
console.log(`✅ Tailwind CSS compiled successfully! Output size: ${result.css.length} bytes`);

