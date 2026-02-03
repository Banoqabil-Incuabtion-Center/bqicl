import bcrypt from 'bcrypt';

const seedFactory = {
    generateAdmin: async (customPassword = 'password') => {
        const password = await bcrypt.hash(customPassword, 10);
        return [{
            name: 'Super Admin',
            email: 'admin@bqicl.com',
            password: password,
            createdAt: new Date(),
            updatedAt: new Date()
        }];
    },

    generateOwners: async (count = 4) => {
        const password = await bcrypt.hash('password', 10);
        const owners = [];
        for (let i = 1; i <= count; i++) {
            owners.push({
                name: `Owner ${i}`,
                email: `owner${i}@example.com`,
                password: password,
                createdAt: new Date(),
                updatedAt: new Date(),
                isOwner: true
            });
        }
        return owners;
    },

    generateTeams: (ownerIds) => {
        const teamNames = ['Titans', 'Knights', 'Warriors', 'Kings'];
        const teams = [];

        ownerIds.forEach((ownerId, index) => {
            if (index < teamNames.length) {
                teams.push({
                    name: teamNames[index],
                    email: `${teamNames[index].toLowerCase()}@example.com`,
                    ownerId: ownerId,
                    totalBudget: 2500000,
                    remainingBudget: 2500000,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    playerCount: 0
                });
            }
        });
        return teams;
    },

    generatePlayers: (count = 50, teamIds = []) => {
        const categories = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper-batsman'];
        const playingStyles = ['right-handed', 'left-handed'];
        const battingOrders = ['Top-order', 'Middle-order', 'Lower-order'];
        const bowlingTypes = ['Fast', 'Medium', 'Spin'];
        const auctionCategories = ['Platinum', 'Diamond', 'Gold', 'Silver'];
        const campuses = ['Bahadurabad', 'Clifton', 'Idara-e-noor', 'Phosphorus'];

        const players = [];
        for (let i = 1; i <= count; i++) {
            players.push({
                name: `Player ${i}`,
                email: `player${i}@example.com`,
                phoneNumber: `0300${Math.floor(1000000 + Math.random() * 9000000)}`,
                playingStyle: playingStyles[Math.floor(Math.random() * playingStyles.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                battingOrder: battingOrders[Math.floor(Math.random() * battingOrders.length)],
                bowlingType: bowlingTypes[Math.floor(Math.random() * bowlingTypes.length)],
                status: 'available',
                isSold: false,
                soldPrice: 0,
                basePrice: 100000 + Math.floor(Math.random() * 900000),
                auctionCategory: auctionCategories[Math.floor(Math.random() * auctionCategories.length)],
                campus: campuses[Math.floor(Math.random() * campuses.length)],
                // Default captain values
                isCaptain: false,
                isViceCaptain: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        return players;
    }
};

export default seedFactory;
