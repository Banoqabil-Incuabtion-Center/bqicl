export async function up(queryInterface, Sequelize) {
    try {
        await queryInterface.removeConstraint('refresh_tokens', 'fk_1');
        console.log('Successfully removed constraint fk_1 from refresh_tokens');
    } catch (error) {
        console.warn('Could not remove constraint fk_1. It might not exist.', error.message);
    }
}

export async function down(queryInterface, Sequelize) {
    // We don't want to restore a faulty constraint
}
