import { PdfConvert } from "pdf-convert-js";
import * as fs from "node:fs";

async function main() {
  const pdfConverter = new PdfConvert("./input/6-1.pdf");

  const buffer = await pdfConverter.convertPageToImage(1);

  await fs.promises.writeFile("./output/6-1.png", buffer);

  pdfConverter.dispose();
}

main();
