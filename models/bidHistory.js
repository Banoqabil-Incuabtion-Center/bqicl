import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class bidHistoryModel extends Model {
    static associate(models) {
        // Link to the player receiving the bid
        bidHistoryModel.belongsTo(models.Player, {
            foreignKey: 'playerId',
            as: 'player'
        });
        
        // Link to the team that made the bid
        bidHistoryModel.belongsTo(models.Team, {
            foreignKey: 'teamId',
            as: 'team'
        });
    }
}

bidHistoryModel.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' }
    },
    teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' }
    },
    bidAmount: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    sequelize: sequelizeTZ,
    modelName: 'BidHistory',
    tableName: 'bid_histories',
    timestamps: true, // This automatically gives us 'createdAt' as the bid timestamp
    updatedAt: false  // Bids are never updated, only created
});

export default bidHistoryModel;