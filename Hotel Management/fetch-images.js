const fs = require('fs');
const path = require('path');
const { menuItems } = require('./db/seed-data');

const IMAGES_DIR = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function run() {
  console.log('Downloading 33 unique images for the menu... This may take a minute.');
  
  for (const [index, item] of menuItems.entries()) {
    const filename = path.basename(item.image_url);
    const filepath = path.join(IMAGES_DIR, filename);
    
    try {
      // Use a more reliable placeholder if loremflickr fails, 
      // but let's try one more robust version of loremflickr first.
      const safeName = encodeURIComponent(item.name.toLowerCase());
      const query = `${safeName},indian,food`;

      // Use the index as a lock to ensure different images for each request
      const url = `https://loremflickr.com/400/300/${query}?lock=${index + 100}`;
      
      console.log(`Downloading (${index+1}/33): ${filename}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        // Fallback to picsum with a unique ID if loremflickr still blocks
        console.warn(`LoremFlickr failed for ${item.name} (${response.status}), trying fallback...`);
        const fallbackUrl = `https://picsum.photos/seed/${safeName}/400/300`;
        const res2 = await fetch(fallbackUrl);
        if (!res2.ok) throw new Error('Fallback also failed');
        const buffer = Buffer.from(await res2.arrayBuffer());
        fs.writeFileSync(filepath, buffer);
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filepath, buffer);
      }
      
      // Delay to avoid being blocked
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Failed to download ${filename}:`, err.message);
    }
  }
  
  console.log('Finished downloading all 33 images!');
}

run().catch(console.error);
