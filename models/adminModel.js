import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class adminModel extends Model {
    static associate(models) {
        adminModel.hasOne(models.RefreshToken, {
            foreignKey: 'UserId',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    };
}

adminModel.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
     isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
},
    {
        sequelize: sequelizeTZ,
        modelName: 'Admin',
        tableName: 'admins',
        timestamps: true,
        paranoid: true
    });

export default adminModel;