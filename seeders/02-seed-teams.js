import seedFactory from '../utils/seedFactory.js';
import dbConfig from '../config/config.js';
const { Sequelize } = dbConfig;

export async function up(queryInterface, Sequelize) {
    // 1. Get Owners to associate
    const [ownerRows] = await queryInterface.sequelize.query(
        `SELECT id FROM owners WHERE email LIKE 'owner%@example.com' ORDER BY id ASC LIMIT 4`
    );

    if (ownerRows.length === 0) {
        console.warn('No owners found to seed teams. Run 01-seed-owners.js first.');
        return;
    }

    const ownerIds = ownerRows.map(row => row.id);

    // 2. Generate and Insert Teams
    await queryInterface.bulkDelete('teams', { name: ['Titans', 'Knights', 'Warriors', 'Kings'] });
    const teams = seedFactory.generateTeams(ownerIds);
    await queryInterface.bulkInsert('teams', teams);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('teams', { name: ['Titans', 'Knights', 'Warriors', 'Kings'] });
}
