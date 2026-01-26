import dbConfig from '../config/config.js';
const { sequelizeTZ, DataTypes, Model } = dbConfig;

class auctionModel extends Model {
    static associate(models) {
        // Link to the player currently being auctioned
        auctionModel.belongsTo(models.Player, {
            foreignKey: 'playerId',
            as: 'currentPlayer'
        });
        
        // Link to the team that holds the current highest bid
        auctionModel.belongsTo(models.Team, {
            foreignKey: 'lastBidTeamId',
            as: 'currentHighestBidder'
        });
    }
}

auctionModel.init({
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
    currentBid: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    },
    lastBidTeamId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'teams', key: 'id' }
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'paused'),
        defaultValue: 'active',
        allowNull: false
    }
}, {
    sequelize: sequelizeTZ,
    modelName: 'Auction',
    tableName: 'auctions',
    timestamps: true
});

export default auctionModel;