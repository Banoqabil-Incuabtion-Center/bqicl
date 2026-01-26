import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class refreshTokenModel extends Model {
    static associate(models) {
        // Polymorphic relationship: user can be Admin or Owner
        // We handle this logic in controllers for now since Sequelize polymorphic
        // associations can be complex for simple use cases.
    }
}

refreshTokenModel.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userType: {
        type: DataTypes.ENUM('admin', 'owner'),
        allowNull: false,
        defaultValue: 'admin'
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    sequelize: sequelizeTZ,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
});

export default refreshTokenModel;