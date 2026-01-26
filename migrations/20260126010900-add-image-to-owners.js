import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('owners', 'image', {
        type: Sequelize.STRING,
        allowNull: true,
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('owners', 'image');
}
