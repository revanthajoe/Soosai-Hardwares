const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { Category, Product, pool } = require('../models');

const run = async () => {
  await connectDB();
  console.log('Database connected.');

  try {
    // 1. Create a category
    let category = await Category.findBySlug('hardware');
    if (!category) {
      category = await Category.create({ name: 'Hardware', slug: 'hardware' });
      console.log('Category created:', category.name);
    } else {
      console.log('Category already exists:', category.name);
    }

    // 2. Create products
    const productsToSeed = [
      {
        name: 'Heavy Duty Hammer',
        slug: 'heavy-duty-hammer',
        category_id: category.id,
        brand: 'Stanley',
        unit: 'piece',
        price: 450,
        stock: 20,
        description: 'Durable steel hammer with fiberglass handle.',
        image: '',
        is_active: true,
        is_featured: true,
      },
      {
        name: 'Phillips Screwdriver Set',
        slug: 'phillips-screwdriver-set',
        category_id: category.id,
        brand: 'Bosch',
        unit: 'set',
        price: 850,
        stock: 15,
        description: 'Magnetic tip screwdriver set of 6 pieces.',
        image: '',
        is_active: true,
        is_featured: false,
      },
      {
        name: 'PVC Pipe 1.5 inch',
        slug: 'pvc-pipe-1-5-inch',
        category_id: category.id,
        brand: 'Finolex',
        unit: 'meter',
        price: 120,
        stock: 100,
        description: 'High-quality PVC pipe for plumbing.',
        image: '',
        is_active: true,
        is_featured: false,
      },
    ];

    for (const prod of productsToSeed) {
      // Check if product exists by slug using raw query because findOneBySlug doesn't return full object simply
      const existing = await Product.findOneBySlug(prod.slug);
      if (!existing) {
        await Product.create(prod);
        console.log('Product created:', prod.name);
      } else {
        console.log('Product already exists:', prod.name);
      }
    }

    console.log('Products seeded successfully.');
  } catch (error) {
    console.error('Error seeding products:', error.message);
  } finally {
    process.exit(0);
  }
};

run();
