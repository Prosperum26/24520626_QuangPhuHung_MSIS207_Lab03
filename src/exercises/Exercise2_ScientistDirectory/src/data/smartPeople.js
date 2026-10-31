import { foldText } from '../components/peopleModel.js';
import people from './people.json';

// Nguồn dữ liệu duy nhất là people.json (bạn chỉnh ở đó). Ở đây chỉ trích ra, tính sẵn MỘT LẦN:
// - searchKey: tên đã chuẩn hóa (mỗi lần gõ không phải chuẩn hóa lại các tên)
// - metrics: object đóng băng cho DeveloperCard (tham chiếu ổn định để memo có tác dụng)
/** @type {readonly import('../components/peopleModel.js').Person[]} */
export const SMART_PEOPLE = Object.freeze(
  people.map(({ id, name, age, iq }) =>
    Object.freeze({ id, name, age, iq, searchKey: foldText(name), metrics: Object.freeze({ age, iq }) }),
  ),
);
