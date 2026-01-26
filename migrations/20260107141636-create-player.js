import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('players', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    phoneNumber: {
      type: Sequelize.STRING,
      allowNull: true
    },
    playerImage: {
      type: Sequelize.STRING,
      allowNull: true
    },
    playingStyle: {
      type: Sequelize.ENUM('right-handed', 'left-handed'),
      allowNull: false,
      defaultValue: 'right-handed'
    },
    category: {
      type: Sequelize.ENUM('Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper-batsman'),
      allowNull: false,
      defaultValue: 'Batsman'
    },
    battingOrder: {
      type: Sequelize.ENUM('Top-order', 'Middle-order', 'Lower-order'),
      allowNull: true,
      defaultValue: 'Top-order'
    },
    bowlingType: {
      type: Sequelize.ENUM('Fast', 'Medium', 'Spin'),
      allowNull: true,
      defaultValue: 'Fast'
    },
    teamId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isSold: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    soldPrice: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    auctionCategory: {
      type: Sequelize.ENUM('Platinum', 'Diamond', 'Gold', 'Silver'),
      allowNull: false,
      defaultValue: 'Silver'
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('players');
}