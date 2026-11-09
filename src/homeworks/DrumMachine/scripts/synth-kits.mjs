// Sinh kit "electronic" (kiểu 808) bằng JS thuần, không thư viện: WAV 16-bit mono 44.1 kHz.
// Chạy: node scripts/synth-kits.mjs   (kết quả cố định: nhiễu dùng PRNG có seed)
// Kit "acoustic" là 7 sample tự tổng hợp từ Lab 1, copy vào public/kits/acoustic.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RATE = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'kits', 'electronic');

function makeNoise(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0; // LCG
    return (s / 0xffffffff) * 2 - 1;
  };
}

/** Tạo mảng mẫu dài `seconds`; `fn(t, i)` trả giá trị -1..1. */
function render(seconds, fn) {
  const n = Math.floor(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE, i);
  return out;
}

const env = (t, decay) => Math.exp(-t * decay);

/** Sóng sin quét tần số từ f0 xuống f1; pha cộng dồn nên không bị "click". */
function sweep(f0, f1, sweepDecay) {
  let phase = 0;
  return (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t * sweepDecay);
    phase += (2 * Math.PI * f) / RATE;
    return Math.sin(phase);
  };
}

/** Lọc thông cao đơn giản (vi phân nhiễu) để ra tiếng "xì" của hi-hat/crash. */
function highpassNoise(seed) {
  const noise = makeNoise(seed);
  let prev = 0;
  return () => {
    const x = noise();
    const y = x - prev;
    prev = x;
    return y * 0.5;
  };
}

const kits = {
  kick: () => {
    const body = sweep(160, 45, 28);
    return render(0.6, (t) => body(t) * env(t, 6) * 0.95);
  },
  snare: () => {
    const tone = sweep(210, 170, 40);
    const noise = highpassNoise(11);
    return render(0.3, (t) => (tone(t) * env(t, 20) * 0.5 + noise() * env(t, 16) * 0.7));
  },
  hihat: () => {
    const noise = highpassNoise(21);
    return render(0.08, (t) => noise() * env(t, 70) * 0.9);
  },
  openhat: () => {
    const noise = highpassNoise(31);
    return render(0.5, (t) => noise() * env(t, 8) * 0.8);
  },
  tom: () => {
    const body = sweep(220, 110, 14);
    return render(0.45, (t) => body(t) * env(t, 7) * 0.9);
  },
  clap: () => {
    const noise = highpassNoise(41);
    // 3 xung ngắn liên tiếp rồi đuôi: nghe như vỗ tay.
    return render(0.3, (t) => {
      const burst = [0, 0.012, 0.024].reduce((a, start) => (t >= start ? Math.max(a, env(t - start, 160)) : a), 0);
      return noise() * (burst * 0.8 + (t > 0.036 ? env(t - 0.036, 22) * 0.5 : 0));
    });
  },
  crash: () => {
    const noise = highpassNoise(51);
    return render(1.2, (t) => noise() * env(t, 3.2) * 0.8);
  },
};

function toWav(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); // kích thước khối fmt
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  // Fade 5ms ở cuối để không còn bước nhảy biên độ (tiếng "pop").
  const fade = Math.floor(0.005 * RATE);
  samples.forEach((v, i) => {
    const tail = samples.length - i;
    const g = tail < fade ? tail / fade : 1;
    const clamped = Math.max(-1, Math.min(1, v * g));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  });
  return buf;
}

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(kits)) {
  writeFileSync(join(OUT, `${name}.wav`), toWav(make()));
}
console.log(`Đã sinh ${Object.keys(kits).length} file vào ${OUT}`);
