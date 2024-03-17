import Jimp from 'jimp';

enum Settings {
  JOIN_SHRINK_TOP = 345,
  JOIN_SHRINK_BOTTOM = 400
}

async function joinImages(image1Path: string, image2Path: string, outputPath: string) {
  const image1 = await Jimp.read(image1Path);
  const image2 = await Jimp.read(image2Path);

  const newImage = new Jimp(
    image1.getWidth(), 
    image1.getHeight() + image2.getHeight() - Settings.JOIN_SHRINK_TOP - Settings.JOIN_SHRINK_BOTTOM
  );

  newImage.composite(image1, 0, 0);
  newImage.composite(
    image2.clone().crop(
      0, 
      Settings.JOIN_SHRINK_TOP, 
      image2.getWidth(),
      image2.getHeight() - Settings.JOIN_SHRINK_TOP
    ), 
    0, 
    image1.getHeight() - Settings.JOIN_SHRINK_BOTTOM
    );

  await newImage.writeAsync(outputPath);
  
  console.log('Images joined successfully!');
}

// Usage
const image1Path = './data/PNG/6-1_7.png';
const image2Path = './data/PNG/6-1_8.png';
const outputPath = './test.png';

joinImages(image1Path, image2Path, outputPath);
