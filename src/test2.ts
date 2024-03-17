import fs, { promises as fsp } from "node:fs";
import Jimp from 'jimp';
enum Settings {
  JOIN_SHRINK_TOP = 345,
  JOIN_SHRINK_BOTTOM = 400
}

async function joinImages(outputPath: string, folder: string) {
  let images = new Array<Jimp>();
  for (let file of await fsp.readdir(folder))
    images.push(await Jimp.read(folder + file));
  
  let height = Settings.JOIN_SHRINK_TOP + Settings.JOIN_SHRINK_BOTTOM;
  for (let img of images)
    height += img.getHeight() - Settings.JOIN_SHRINK_TOP - Settings.JOIN_SHRINK_BOTTOM;

  let result = new Jimp(images[0].getWidth(), height);
  
  let currentY = Settings.JOIN_SHRINK_TOP;
  for (let img of images) {
    result.composite(img, 0, currentY);
    currentY += img.getHeight();
  }

  result.writeAsync(outputPath);
}

joinImages("./test.png", './data/PNG/');
