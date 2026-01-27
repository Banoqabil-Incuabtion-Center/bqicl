import { DataTypes } from 'sequelize';
import dbConfig from '../config/config.js';

const sequelize = dbConfig.sequelizeTZ;

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING, // Or TEXT if you expect large JSON
        allowNull: false
    }
}, {
    tableName: 'Settings',
    timestamps: true
});

export default Setting;
