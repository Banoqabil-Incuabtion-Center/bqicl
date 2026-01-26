import seedFactory from '../utils/seedFactory.js';
import dbConfig from '../config/config.js';
const { Sequelize } = dbConfig;

export async function up(queryInterface, Sequelize) {
    // 1. Generate and Insert Players
    await queryInterface.bulkDelete('players', { email: { [Sequelize.Op.like]: 'player%@example.com' } });

    const players = seedFactory.generatePlayers(50);
    await queryInterface.bulkInsert('players', players);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('players', { email: { [Sequelize.Op.like]: 'player%@example.com' } });
}
