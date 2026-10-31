// Logic thuần của ScientistDirectory: chuẩn hóa chuỗi, khớp tên, lọc + sắp xếp.
// Không đụng DOM/React nên test nhanh và mỗi quyết định nằm một chỗ.

/** @typedef {{ id: string, name: string, age: number, iq: number, searchKey: string }} Person */
/** @typedef {'iq-desc' | 'age-asc'} SortKey */

export const DEFAULT_MIN_IQ = 160;
/** @type {SortKey} */
export const DEFAULT_SORT = 'iq-desc';

/**
 * Chuẩn hóa để so khớp: hạ chữ thường, bỏ dấu, đ -> d.
 * Dùng cho CẢ query và dữ liệu nên hoa/thường và có/không dấu khớp hai chiều.
 * @param {unknown} text
 * @returns {string}
 */
export function foldText(text) {
  return String(text ?? '')
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/gu, 'd');
}

/**
 * Tách query thành các token đã chuẩn hóa (rỗng nếu chỉ có khoảng trắng).
 * @param {string} query
 * @returns {string[]}
 */
export function tokenize(query) {
  return foldText(query).split(/\s+/u).filter(Boolean);
}

/**
 * Mọi token phải là chuỗi con của searchKey (AND, không phụ thuộc thứ tự).
 * @param {Person} person
 * @param {readonly string[]} tokens
 * @returns {boolean}
 */
export function matchesQuery(person, tokens) {
  return tokens.every((token) => person.searchKey.includes(token));
}

const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Lọc rồi sắp xếp mà không mutate `people` (toSorted trả mảng mới).
 * Trùng điểm thì xếp theo tên để thứ tự ổn định.
 * @param {readonly Person[]} people
 * @param {{ query: string, minIq: number, sortBy: SortKey }} criteria
 * @returns {Person[]}
 */
export function selectVisible(people, { query, minIq, sortBy }) {
  const tokens = tokenize(query);
  return people
    .filter((person) => person.iq >= minIq && matchesQuery(person, tokens))
    .toSorted((a, b) => {
      const primary = sortBy === 'age-asc' ? a.age - b.age : b.iq - a.iq;
      return primary || compareText(a.searchKey, b.searchKey);
    });
}
