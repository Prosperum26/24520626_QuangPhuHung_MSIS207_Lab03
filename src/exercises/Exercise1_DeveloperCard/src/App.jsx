import styles from './App.module.css';
import { DeveloperCard } from './components/DeveloperCard.jsx';

// Các ca kiểm thử của Exercise 1 ở một chỗ, hằng module nên tham chiếu ổn định mỗi render.
// /broken-avatar.png là file không phải ảnh (public/): server trả 200 nên onError chạy mà Console không có lỗi mạng.
const DEMO_CARDS = [
  { id: 'default' },
  {
    id: 'long',
    fullName: 'Nguyễn Thị Minh Khai Phạm Trần Quang Đức Anh Tuấn',
    role: 'Senior Frontend Engineer, Accessibility and Performance Guild',
    metrics: { commits: 1234567, vdomNodes: 5000, a11yScore: 100, openIssues: 3 },
    skills: [
      { id: 's1', name: 'React 19 Fiber', tier: 'Core' },
      { id: 's2', name: 'Semantic HTML', tier: 'Core' },
      { id: 's3', name: 'CSS Modules', tier: 'Core' },
      { id: 's4', name: 'Web Audio API', tier: 'Awareness' },
      { id: 's5', name: 'React.memo', tier: 'Awareness' },
    ],
  },
  { id: 'broken', fullName: 'Ada Lovelace', role: 'Mathematician', avatarUrl: '/broken-avatar.png' },
  { id: 'bare', fullName: 'Grace Hopper', role: 'Computer Scientist', avatarUrl: null, metrics: {}, skills: [] },
];

export function App() {
  return (
    <main className={styles.page}>
      <h1>Exercise 1: Developer Card</h1>
      <section aria-label="Các trường hợp hiển thị" className={styles.cards}>
        {DEMO_CARDS.map(({ id, ...props }) => (
          <DeveloperCard key={id} {...props} />
        ))}
      </section>
    </main>
  );
}
