const { Sequelize } = require('sequelize');

const useSsl = process.env.PG_SSL === 'true';

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: useSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
    })
  : new Sequelize(
      process.env.PGDATABASE || 'soosai_hardwares',
      process.env.PGUSER || 'postgres',
      process.env.PGPASSWORD || '',
      {
        host: process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.PGPORT || 5432),
        dialect: 'postgres',
        logging: false,
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const alter = process.env.DB_SYNC_ALTER === 'true';
    await sequelize.sync({ alter });
    console.log('PostgreSQL connected successfully.');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.sequelize = sequelize;
