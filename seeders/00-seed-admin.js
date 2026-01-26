import seedFactory from '../utils/seedFactory.js';
import dbConfig from '../config/config.js';
const { Sequelize } = dbConfig;

export async function up(queryInterface, Sequelize) {
    // Cleanup existing admin with this email
    await queryInterface.bulkDelete('admins', { email: 'admin@bqicl.com' });

    const admin = await seedFactory.generateAdmin();
    await queryInterface.bulkInsert('admins', admin);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admins', { email: 'admin@bqicl.com' });
}
