import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    // 1. Remove the foreign key constraint
    // The constraint name was found in the error message: refresh_tokens_ibfk_1
    try {
        await queryInterface.removeConstraint('refresh_tokens', 'refresh_tokens_ibfk_1');
    } catch (error) {
        console.warn('Could not remove constraint refresh_tokens_ibfk_1. It might not exist or has a different name.', error.message);
    }

    // 2. Add userType column
    await queryInterface.addColumn('refresh_tokens', 'userType', {
        type: Sequelize.ENUM('admin', 'owner'),
        allowNull: false,
        defaultValue: 'admin'
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('refresh_tokens', 'userType');

    // Attempt to restore the constraint (might fail if data is inconsistent)
    try {
        await queryInterface.addConstraint('refresh_tokens', {
            fields: ['userId'],
            type: 'foreign key',
            name: 'refresh_tokens_ibfk_1',
            references: {
                table: 'admins',
                field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    } catch (error) {
        console.warn('Could not restore constraint refresh_tokens_ibfk_1 during rollback.', error.message);
    }
}
