import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class teamModel extends Model {

    static associate(models) {
        
        teamModel.belongsTo(models.Owner, {
            foreignKey: 'ownerId',
            as: 'owner',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        teamModel.hasMany(models.Player, {
            foreignKey: 'teamId',
            as: 'players',
            onDelete: 'SET NULL', 
            onUpdate: 'CASCADE'
        });
    }
}

teamModel.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    teamLogo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    playerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // New Budget Fields for Phase 2
    totalBudget: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
    },
    remainingBudget: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
    }
},
    {
        sequelize: sequelizeTZ,
        modelName: 'Team', 
        tableName: 'teams',
        timestamps: true,
        paranoid: true
    });

export default teamModel;