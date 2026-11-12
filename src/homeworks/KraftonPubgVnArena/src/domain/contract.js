// Contract theo slide (pubg-vn-arena-contract.ts), viết bằng JSDoc vì dự án dùng JS.

/** @typedef {'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED'} DropPhase */

/**
 * @typedef {object} PubgCrateDrop
 * @property {string} id
 * @property {string} title            vd 'PVS Finals VIP Pass + 5,000 G-Coin'
 * @property {number} priceVnd         định dạng bằng formatVnd
 * @property {number} remainingStock
 * @property {number} dropEpochMs
 */

/**
 * @typedef {object} PubgVnSquadStanding
 * @property {string} squadId          'te' | 'ces' | 'ge' | 'agg'
 * @property {string} squadName
 * @property {number} wwcdCount        Winner Winner Chicken Dinner
 * @property {number} placementPts
 * @property {number} killPts
 */

export {};
