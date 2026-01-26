import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('bid_histories', {
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
        teamId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'teams',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        bidAmount: {
            type: Sequelize.BIGINT,
            allowNull: false
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE
        }
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bid_histories');
}