import { LATENCY_MAX_MS, LATENCY_MIN_MS, TELEMETRY_URL } from '../src/config/telemetry.js';
import { SQUADS_BY_ID } from '../src/data/pubgSquads.js';

/**
 * "Vệ tinh" giả: trả JSON của squad sau 800-1200ms. Dữ liệu lấy từ cùng một nguồn với app
 * (src/data/pubgSquads.js) nên không có bản sao để lệch. Client huỷ thì timer phía server cũng dừng.
 */
export function createTelemetryHandler({
  squads = SQUADS_BY_ID,
  rng = Math.random,
  minMs = LATENCY_MIN_MS,
  maxMs = LATENCY_MAX_MS,
} = {}) {
  return (req, res) => {
    const id = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\//, ''));
    const squad = squads.get(id);

    const timer = setTimeout(() => {
      if (!squad) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(squad));
    }, minMs + rng() * (maxMs - minMs));

    // res 'close' phát khi phản hồi xong hoặc kết nối bị ngắt (client abort): không để timer treo.
    res.on('close', () => clearTimeout(timer));
  };
}

export function telemetryPlugin() {
  // Không được trả về giá trị: Vite coi hàm trả về từ configureServer là hook "post" và gọi nó.
  const mount = (server) => {
    server.middlewares.use(TELEMETRY_URL, createTelemetryHandler());
  };
  return { name: 'pubg-telemetry', configureServer: mount, configurePreviewServer: mount };
}
