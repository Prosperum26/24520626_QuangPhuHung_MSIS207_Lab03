import { useId, useReducer, useState } from 'react';
import { transition } from './fsm.js';
import { createSignal, effortReducer, impactOf, isRedFlag } from './effort.js';

const PHASE_LABEL = {
  FRIENDS: 'Bạn bè',
  DATING_NO_LOVE: 'Hẹn hò nhưng không yêu',
  OFFICIAL_LOVE: 'Yêu chính thức',
  GHOSTED_EXIT: 'Đã bị bỏ rơi',
};
const ACTOR_LABEL = { EM: 'Em', AI_DO: 'Ai đó' };

// Chỉ phase + log là state; điểm và cờ đỏ tính lại trong render (không useEffect).
const INITIAL = { phase: 'FRIENDS', log: [], nextId: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'EVENT':
      return { ...state, phase: transition(state.phase, action.event) };
    case 'SEND': {
      if (state.phase === 'GHOSTED_EXIT') return state;
      const signal = createSignal(`sig-${state.nextId}`, action.actor, action.steps);
      return { ...state, log: effortReducer(state.log, { type: 'ADD', signal }), nextId: state.nextId + 1 };
    }
    case 'RESET':
      return INITIAL;
    default:
      return state;
  }
}

const round1 = (n) => String(Math.round(n * 10) / 10);

export function SituationshipAnalyzer() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [actor, setActor] = useState('EM');
  const [steps, setSteps] = useState(1);
  const actorId = useId();
  const stepsId = useId();
  const scoresTitleId = useId();
  const logTitleId = useId();

  const { phase, log } = state;
  const emImpact = impactOf(log, 'EM');
  const rivalImpact = impactOf(log, 'AI_DO');
  const redFlag = isRedFlag(phase, emImpact, rivalImpact);
  const ghosted = phase === 'GHOSTED_EXIT';
  const canSend = !ghosted && Number.isInteger(steps) && steps >= 1;
  const can = (event) => transition(phase, event) !== phase;

  let message = 'Ổn, chưa có dấu hiệu lạ.';
  if (ghosted) message = 'Kết thúc: đã bị bỏ rơi. Bấm Reset để thử lại.';
  else if (redFlag) message = `Cờ đỏ: em cố ${round1(emImpact)} điểm mà ai đó chỉ cần ${round1(rivalImpact)} điểm.`;

  function handleSteps(e) {
    const n = e.target.valueAsNumber;
    setSteps(Number.isNaN(n) ? NaN : n);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (canSend) dispatch({ type: 'SEND', actor, steps });
  }

  return (
    <main>
      <header>
        <hgroup>
          <h1>Situationship Analyzer</h1>
          <p>Hẹn hò nhưng không yêu: máy trạng thái thay cho đống boolean.</p>
        </hgroup>
      </header>

      <section aria-label="Pha quan hệ">
        <h2>Pha quan hệ</h2>
        <p><strong>{PHASE_LABEL[phase]}</strong></p>
        <button type="button" disabled={!can('ASK_OUT')} onClick={() => dispatch({ type: 'EVENT', event: 'ASK_OUT' })}>
          Rủ đi chơi
        </button>
        <button type="button" disabled={!can('COMMIT')} onClick={() => dispatch({ type: 'EVENT', event: 'COMMIT' })}>
          Official
        </button>
        <button type="button" disabled={!can('GHOST')} onClick={() => dispatch({ type: 'EVENT', event: 'GHOST' })}>
          Dừng Lại
        </button>
        <button type="button" onClick={() => dispatch({ type: 'RESET' })}>
          Reset
        </button>
      </section>

      <section aria-labelledby={scoresTitleId}>
        <h2 id={scoresTitleId}>Điểm nỗ lực</h2>
        <dl>
          <dt>Em</dt>
          <dd>{round1(emImpact)}</dd>
          <dt>Ai đó</dt>
          <dd>{round1(rivalImpact)}</dd>
        </dl>
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- đề yêu cầu ghi tường minh role="status" aria-live="polite" */}
        <output role="status" aria-live="polite">{message}</output>
      </section>

      <section aria-label="Gửi tín hiệu">
        <h2>Gửi tín hiệu</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor={actorId}>Ai nhắn</label>
          <select id={actorId} value={actor} onChange={(e) => setActor(e.target.value)}>
            <option value="EM">Em (x0.1)</option>
            <option value="AI_DO">Ai đó (x50)</option>
          </select>
          <label htmlFor={stepsId}>Số bước</label>
          <input id={stepsId} type="number" min="1" step="1" value={Number.isNaN(steps) ? '' : steps} onChange={handleSteps} />
          <button type="submit" disabled={!canSend}>Gửi tín hiệu</button>
        </form>
      </section>

      <section aria-labelledby={logTitleId}>
        <h2 id={logTitleId}>Nhật ký</h2>
        <ul>
          {log.map((s) => (
            <li key={s.id}>{ACTOR_LABEL[s.actor]}: {s.steps} bước x {s.multiplier}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
