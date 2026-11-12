// Dữ liệu mẫu và cấu hình ở MỘT chỗ. Số liệu đội/crate là dữ liệu giả để demo.

/** Lệch đồng hồ máy khách so với server (ms), để mô phỏng và test. */
export const SERVER_OFFSET_MS = 0;

/** @type {readonly import('./contract.js').PubgVnSquadStanding[]} */
export const SQUADS = [
  { squadId: 'te', squadName: 'The Expendables', wwcdCount: 4, placementPts: 112, killPts: 98 },
  { squadId: 'ces', squadName: 'Cerberus Esports', wwcdCount: 3, placementPts: 104, killPts: 121 },
  { squadId: 'ge', squadName: 'Roy Esports', wwcdCount: 2, placementPts: 87, killPts: 76 },
  { squadId: 'agg', squadName: 'AGG', wwcdCount: 2, placementPts: 93, killPts: 84 },
];

/**
 * Crate demo: giờ drop tính từ lúc tải trang để luôn thấy đếm ngược.
 * @param {number} [nowMs]
 * @returns {import('./contract.js').PubgCrateDrop[]}
 */
export function createSampleCrates(nowMs = Date.now()) {
  return [
    { id: 'pvs-vip-ticket', title: 'PVS Grand Finals VIP Ticket', priceVnd: 350000, remainingStock: 5, dropEpochMs: nowMs + 20_000 },
    { id: 'g-coin-crate', title: 'PVS Finals VIP Pass + 5,000 G-Coin', priceVnd: 99000, remainingStock: 1, dropEpochMs: nowMs + 45_000 },
  ];
}

/** Xác suất một người chơi khác lấy suất trước, để demo thấy 409 rollback. */
export const RIVAL_CHANCE = 0.35;
