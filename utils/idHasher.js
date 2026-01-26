import Hashids from 'hashids';

// ⚠️ IMPORTANT: Change "my-secret-salt" to something unique in your .env file
const hashids = new Hashids(process.env.HASH_ID_SECRET || "auction-pro-super-secret", 8); 

export const encodeId = (id) => {
    return hashids.encode(id);
};

export const decodeId = (hashedId) => {
    const decoded = hashids.decode(hashedId);
    // If decoding fails or array is empty, return null
    return decoded.length ? decoded[0] : null;
};