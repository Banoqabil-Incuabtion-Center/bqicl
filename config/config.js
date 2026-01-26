import dotenv from 'dotenv';
import { Sequelize, DataTypes, Model } from 'sequelize';
dotenv.config();

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const config = {
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    host: process.env.DB_HOST, // Now points to TiDB host
    dialect: 'mysql',
    port: process.env.DB_PORT || 4000 // TiDB uses 4000 by default
};

const sequelizeTZ = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    logging: false,

    // ✅ CORRECT STRUCTURE:
    dialectOptions: {
        ssl: (process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') ? {
            require: true,
            rejectUnauthorized: false
        } : false,
        connectTimeout: 60000
    },

    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    }
}
);

sequelizeTZ.authenticate()
    .then(() => {
        console.log('✅ Connection to Database established successfully.');
    })
    .catch((error) => {
        console.error('❌ Unable to connect to the database:', error);
    });

const connection = {};

connection.sequelizeTZ = sequelizeTZ;
connection.Sequelize = Sequelize;
connection.DataTypes = DataTypes;
connection.Model = Model;

export default connection;