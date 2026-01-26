import seedFactory from '../utils/seedFactory.js';
import dbConfig from '../config/config.js';
const { Sequelize } = dbConfig;

export async function up(queryInterface, Sequelize) {
    // Cleanup any existing owners to avoid uniqueness constraints
    await queryInterface.bulkDelete('owners', { email: { [Sequelize.Op.like]: 'owner%@example.com' } });

    const owners = await seedFactory.generateOwners(4);
    await queryInterface.bulkInsert('owners', owners);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('owners', { email: { [Sequelize.Op.like]: 'owner%@example.com' } });
}
