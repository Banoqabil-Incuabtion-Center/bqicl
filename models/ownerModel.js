import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class ownerModel extends Model {
    static associate(models) {
        ownerModel.hasOne(models.Team, {
            foreignKey: 'ownerId',
            as: 'team',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
}

ownerModel.init({
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
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    isOwner: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }

},
    {
        sequelize: sequelizeTZ,
        modelName: 'Owner',
        tableName: 'owners',
        timestamps: true,
        paranoid: true
    });

export default ownerModel;