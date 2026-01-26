import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('auctions', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        playerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'players',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        currentBid: {
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0
        },
        lastBidTeamId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'teams',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        status: {
            type: Sequelize.ENUM('active', 'completed', 'paused'),
            defaultValue: 'active',
            allowNull: false
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
        }
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('auctions');
}