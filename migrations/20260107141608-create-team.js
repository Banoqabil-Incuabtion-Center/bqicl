import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('teams', {
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
    ownerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'owners',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    teamLogo: {
      type: Sequelize.STRING,
      allowNull: true
    },
    playerCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
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
  await queryInterface.dropTable('teams');
}