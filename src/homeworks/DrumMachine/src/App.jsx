import { DrumMachine } from './DrumMachine.jsx';

export function App() {
  return (
    <main>
      <header>
        <hgroup>
          <h1>Drum Kit</h1>
          <p>Nhấn phím W A S D J K L hoặc chạm vào pad để chơi.</p>
        </hgroup>
      </header>
      <DrumMachine />
    </main>
  );
}
