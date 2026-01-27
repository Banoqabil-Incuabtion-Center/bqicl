import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class settingModel extends Model { }

settingModel.init({
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize: sequelizeTZ,
    modelName: 'Setting',
    tableName: 'Settings',
    timestamps: true
});

export default settingModel;
