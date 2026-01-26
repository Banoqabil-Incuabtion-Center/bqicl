import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('admins', 'password', {
      type: Sequelize.STRING,
      allowNull:false,
    });
     
  }

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('admins', 'password');
}
