import { foldText } from '../components/peopleModel.js';
import people from './people.json';

// Nguồn dữ liệu duy nhất là people.json (bạn chỉnh ở đó). Ở đây chỉ trích ra, thêm
// searchKey đã chuẩn hóa MỘT LẦN (mỗi lần gõ không phải chuẩn hóa lại các tên) và đóng băng.
/** @type {readonly import('../components/peopleModel.js').Person[]} */
export const SMART_PEOPLE = Object.freeze(
  people.map(({ id, name, age, iq }) => Object.freeze({ id, name, age, iq, searchKey: foldText(name) })),
);
