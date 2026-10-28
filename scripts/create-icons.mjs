import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
const directory = new URL("../public/icons/", import.meta.url);
const source = await readFile(new URL("pokette.svg", directory), "utf8");
for (const width of [32, 180, 192, 512]) {
  const png = new Resvg(source, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
  await writeFile(new URL(`pokette-${width}.png`, directory), png);
  if (width === 512)
    await writeFile(new URL("pokette-maskable-512.png", directory), png);
}
console.log("Generated home-screen icons from the local SVG.");
