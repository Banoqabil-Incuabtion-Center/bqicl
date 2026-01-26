import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('admins', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // 2. Add isOwner to 'owners' table
    await queryInterface.addColumn('owners', 'isOwner', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // 3. Add isPlayer to 'players' table
    // (Ensure your table name is plural 'players' or singular 'player' based on your DB)
    await queryInterface.addColumn('players', 'isPlayer', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('owners');
}