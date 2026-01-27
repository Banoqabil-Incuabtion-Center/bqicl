import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('Settings', {
        key: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING
        },
        value: {
            allowNull: false,
            type: Sequelize.STRING
        },
        createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
    });

    // Seed default value
    await queryInterface.bulkInsert('Settings', [{
        key: 'auction_session_active',
        value: 'false',
        createdAt: new Date(),
        updatedAt: new Date()
    }]);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Settings');
}
