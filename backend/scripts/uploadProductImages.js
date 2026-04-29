const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { Product } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

const images = [
  { slug: 'heavy-duty-hammer', path: 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\f097d028-f2f0-4376-b613-a5b99f334d94\\hammer_1777486604843.png' },
  { slug: 'phillips-screwdriver-set', path: 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\f097d028-f2f0-4376-b613-a5b99f334d94\\screwdriver_set_1777486618876.png' },
  { slug: 'pvc-pipe-1-5-inch', path: 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\f097d028-f2f0-4376-b613-a5b99f334d94\\pvc_pipe_1777486632726.png' }
];

const run = async () => {
  await connectDB();
  console.log('Database connected.');

  try {
    for (const item of images) {
      const product = await Product.findOneBySlug(item.slug);
      if (product) {
        if (!product.image) {
          console.log(`Uploading image for ${item.slug}...`);
          const buffer = fs.readFileSync(item.path);
          // uploadToCloudinary takes a buffer and folder name
          const uploadResult = await uploadToCloudinary(buffer, { folder: 'soosai_products' });
          
          if (uploadResult && uploadResult.secure_url) {
            console.log(`Image uploaded: ${uploadResult.secure_url}. Updating database...`);
            await Product.update(product.id, { image: uploadResult.secure_url });
            console.log(`Successfully updated product ${item.slug} with new image URL.`);
          }
        } else {
          console.log(`Product ${item.slug} already has an image.`);
        }
      } else {
        console.log(`Product ${item.slug} not found in DB.`);
      }
    }
  } catch (error) {
    console.error('Error uploading images:', error.message);
  } finally {
    process.exit(0);
  }
};

run();
