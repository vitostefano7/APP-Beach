import { v2 as cloudinary } from "cloudinary";
import "../config/cloudinary"; // Usa la config esistente

async function testCloudinary() {
  try {
    console.log("Cercando immagini su Cloudinary...\n");
    
    const result = await cloudinary.search
      .expression('resource_type:image')
      .max_results(100)
      .execute();

    console.log(`Total images: ${result.total_count}\n`);
    
    // Raggruppa per cartella
    const folders = new Map<string, any[]>();
    
    result.resources.forEach((r: any) => {
      const folder = r.folder || 'root';
      if (!folders.has(folder)) {
        folders.set(folder, []);
      }
      folders.get(folder)?.push(r);
    });

    console.log("Immagini per cartella:");
    folders.forEach((images, folder) => {
      console.log(`\n📁 ${folder} (${images.length} immagini):`);
      images.slice(0, 3).forEach((img: any) => {
        console.log(`   - ${img.public_id}`);
        console.log(`     ${img.secure_url}`);
      });
      if (images.length > 3) {
        console.log(`   ... e altre ${images.length - 3} immagini`);
      }
    });
  } catch (error) {
    console.error("Errore:", error);
  }
}

testCloudinary();
