import { useState } from 'react';
import { createArenaApi } from './api/arena.js';
import { RIVAL_CHANCE, SERVER_OFFSET_MS, SQUADS, createSampleCrates } from './domain/arenaConfig.js';
import { CrateCard } from './components/CrateCard.jsx';
import { Leaderboard } from './components/Leaderboard.jsx';
import styles from './App.module.css';

export function App() {
  // Khởi tạo một lần: giờ drop tính từ lúc tải trang, API giả giữ kho server.
  const [crates] = useState(() => createSampleCrates());
  const [api] = useState(() =>
    createArenaApi({
      stock: Object.fromEntries(crates.map((c) => [c.id, c.remainingStock])),
      rivalChance: RIVAL_CHANCE,
    }),
  );

  return (
    <main className={styles.page}>
      <header>
        <hgroup className={styles.masthead}>
          <h1 className={styles.title}>PVS Arena</h1>
          <p className={styles.lede}>Săn vé PVS Grand Finals và G-Coin Crate khi airdrop mở.</p>
        </hgroup>
      </header>

      <section className={styles.section} aria-labelledby="crates-heading">
        <h2 id="crates-heading">Airdrop</h2>
        <ul className={styles.crates}>
          {crates.map((crate) => (
            <li key={crate.id}>
              <CrateCard crate={crate} reserveCrate={api.reserveCrate} serverOffsetMs={SERVER_OFFSET_MS} />
            </li>
          ))}
        </ul>
      </section>

      <Leaderboard squads={SQUADS} />
    </main>
  );
}
