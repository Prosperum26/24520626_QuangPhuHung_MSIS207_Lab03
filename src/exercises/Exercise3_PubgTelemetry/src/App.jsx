import styles from './App.module.css';
import { PubgMatchTelemetry } from './components/PubgMatchTelemetry.jsx';

export function App() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>KRAFTON PUBG Vietnam Series: Live Telemetry</h1>
        <p>Radar trực tiếp cho các squad PUBG Vietnam Series. Đổi squad nhanh sẽ huỷ request cũ.</p>
      </header>
      <PubgMatchTelemetry />
    </main>
  );
}
