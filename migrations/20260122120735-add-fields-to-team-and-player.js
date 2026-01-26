import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'totalBudget', {
      type: Sequelize.BIGINT,
      allowNull:false,
    });
    await queryInterface.addColumn('teams', 'remainingBudget', {
      type: Sequelize.BIGINT,
      allowNull:false,
    });

    await queryInterface.addColumn('players', 'status', {
      type: Sequelize.ENUM('available', 'bidding', 'sold', 'unsold'),
      defaultValue: 'available',
      allowNull: false,
    });

    // 2. Change 'soldPrice' to BIGINT
    await queryInterface.changeColumn('players', 'soldPrice', {
      type: Sequelize.BIGINT,
      allowNull: true,
      defaultValue: 0,
    });
   
     
  }

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('owners', 'password');

}

