import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('players', 'basePrice', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
  await queryInterface.addColumn('players', 'campus', {
    type: Sequelize.STRING,
    allowNull: true,
  });

}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('players', 'basePrice');
  await queryInterface.removeColumn('players', 'campus');
}

