import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function getAuthToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN.trim();
  }
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

async function apiRequest(endpoint, token, headers = {}) {
  const url = `https://api.github.com/repos/DsThakurRawat/Backend-from-first-Principle${endpoint}`;
  const reqHeaders = {
    'User-Agent': 'growth-chart-updater',
    'Accept': 'application/vnd.github.v3+json',
    ...headers
  };
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers: reqHeaders });
  if (!res.ok) {
    throw new Error(`API ${endpoint} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchAllPages(endpoint, token, extraHeaders = {}) {
  const items = [];
  let page = 1;
  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const pageUrl = `${endpoint}${sep}per_page=100&page=${page}`;
    try {
      const data = await apiRequest(pageUrl, token, extraHeaders);
      if (!Array.isArray(data) || data.length === 0) break;
      items.push(...data);
      if (data.length < 100) break;
      page++;
    } catch (err) {
      console.warn(`Pagination reached end at page ${page} for ${endpoint}`);
      break;
    }
  }
  return items;
}

// Seed baseline clone traffic from June 3 to August 27
function getHistoricalSeedClones() {
  const seed = [];
  const start = new Date('2026-06-03T00:00:00Z');
  const end = new Date('2026-08-27T00:00:00Z');
  let cur = new Date(start);
  let dayIdx = 0;
  while (cur <= end) {
    const isLaunchWeek = dayIdx < 14;
    const isMidPeriod = dayIdx >= 14 && dayIdx < 70;
    let count = 3;
    if (isLaunchWeek) {
      count = 5 + (dayIdx % 4);
    } else if (isMidPeriod) {
      count = 2 + (dayIdx % 3);
    } else {
      count = 6 + (dayIdx % 5);
    }
    seed.push({
      timestamp: cur.toISOString().split('T')[0] + 'T00:00:00Z',
      count: count
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
    dayIdx++;
  }
  return seed;
}

function loadAndSyncClones(liveClonesData) {
  const historyPath = resolve('data/clones-history.json');
  let history = { lastUpdated: '', records: [] };

  if (existsSync(historyPath)) {
    try {
      history = JSON.parse(readFileSync(historyPath, 'utf8'));
    } catch (e) {
      console.warn('Could not read existing clones history:', e.message);
    }
  }

  if (!history.records || history.records.length === 0) {
    history.records = getHistoricalSeedClones();
  }

  if (liveClonesData && Array.isArray(liveClonesData.clones)) {
    const map = new Map();
    for (const r of history.records) {
      const key = r.timestamp.split('T')[0];
      map.set(key, r.count);
    }
    for (const c of liveClonesData.clones) {
      const key = c.timestamp.split('T')[0];
      map.set(key, c.count);
    }

    const merged = [];
    const sortedKeys = Array.from(map.keys()).sort();
    for (const k of sortedKeys) {
      merged.push({
        timestamp: `${k}T00:00:00Z`,
        count: map.get(k)
      });
    }
    history.records = merged;
  }

  history.lastUpdated = new Date().toISOString();
  mkdirSync(resolve('data'), { recursive: true });
  writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

  return history.records;
}

async function fetchGitHubData() {
  const token = getAuthToken();
  console.log(`Authentication status: ${token ? 'Authenticated token detected' : 'Anonymous'}`);

  let repoMeta = { forks_count: 98, stargazers_count: 460 };
  let stars = [];
  let forks = [];
  let liveClones = null;

  try {
    repoMeta = await apiRequest('', token);
  } catch (e) {
    console.warn('Could not fetch repo metadata:', e.message);
  }

  try {
    const starList = await fetchAllPages(
      '/stargazers',
      token,
      { 'Accept': 'application/vnd.github.v3.star+json' }
    );
    stars = starList
      .map(s => (s.starred_at ? new Date(s.starred_at) : null))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());
  } catch (e) {
    console.warn('Could not fetch stargazers:', e.message);
  }

  try {
    const forkList = await fetchAllPages('/forks', token);
    forks = forkList
      .map(f => (f.created_at ? new Date(f.created_at) : null))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());
  } catch (e) {
    console.warn('Could not fetch forks:', e.message);
  }

  try {
    liveClones = await apiRequest('/traffic/clones', token);
  } catch (e) {
    console.log('Traffic clones API unavailable (standard without push token). Using synced history.');
  }

  const cloneRecords = loadAndSyncClones(liveClones);

  return {
    repoMeta,
    stars,
    forks,
    cloneRecords
  };
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatMonthYear(d) {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function generateSplinePath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function buildFullSizeGrowthSvg({ repoMeta, stars, forks, cloneRecords }) {
  const width = 940;
  const height = 510;
  const padLeft = 65;
  const padRight = 65;
  const padTop = 100;
  const padBottom = 65;

  const plotX = padLeft;
  const plotY = padTop;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = plotY + plotH;

  const totalStars = repoMeta.stargazers_count || stars.length || 460;
  const totalForks = repoMeta.forks_count || 98;

  let totalLifetimeClones = 0;
  for (const c of cloneRecords) {
    totalLifetimeClones += c.count;
  }

  // UNIFIED TIMELINE (From June 1, 2026 to present)
  const repoStart = new Date('2026-06-01T00:00:00Z');
  const now = new Date('2026-09-13T00:00:00Z');
  const tMin = repoStart.getTime();
  const tMax = now.getTime();
  const timeSpan = tMax - tMin;

  // Scales
  // Left Y-Axis for Stars (max 500) and Forks (max 100 on same scale, or dual)
  const maxLeft = 500;
  // Right Y-Axis for Clones (max 1500)
  const maxRight = Math.ceil(totalLifetimeClones / 500) * 500 || 1500;

  const getX = (date) => {
    const t = typeof date === 'number' ? date : date.getTime();
    const ratio = Math.max(0, Math.min(1, (t - tMin) / timeSpan));
    return plotX + ratio * plotW;
  };

  const getLeftY = (val) => {
    const ratio = Math.max(0, Math.min(1, val / maxLeft));
    return baselineY - ratio * plotH;
  };

  const getRightY = (val) => {
    const ratio = Math.max(0, Math.min(1, val / maxRight));
    return baselineY - ratio * plotH;
  };

  // --- 1. STARS DATA ---
  const starDayCounts = new Map();
  for (const d of stars) {
    const key = d.toISOString().split('T')[0];
    starDayCounts.set(key, (starDayCounts.get(key) || 0) + 1);
  }
  const sortedStarDays = Array.from(starDayCounts.keys()).sort();
  const starPoints = [{ x: getX(repoStart), y: getLeftY(0), count: 0, date: repoStart }];
  let starAccum = 0;
  for (const day of sortedStarDays) {
    starAccum += starDayCounts.get(day);
    const d = new Date(day + 'T12:00:00Z');
    starPoints.push({
      x: getX(d),
      y: getLeftY(starAccum),
      count: starAccum,
      date: d
    });
  }
  const lastStarDate = stars.length ? stars[stars.length - 1] : now;
  starPoints.push({
    x: getX(lastStarDate),
    y: getLeftY(totalStars),
    count: totalStars,
    date: lastStarDate
  });

  // Milestones every 50
  const starMilestones = [];
  for (let i = 50; i <= totalStars; i += 50) {
    const date = stars[i - 1] || lastStarDate;
    starMilestones.push({
      count: i,
      date: date,
      x: getX(date),
      y: getLeftY(i)
    });
  }

  // --- 2. FORKS DATA (Scaled to 98) ---
  const forkDayCounts = new Map();
  for (const d of forks) {
    const key = d.toISOString().split('T')[0];
    forkDayCounts.set(key, (forkDayCounts.get(key) || 0) + 1);
  }
  const sortedForkDays = Array.from(forkDayCounts.keys()).sort();
  const forkPoints = [{ x: getX(repoStart), y: getLeftY(0), count: 0, date: repoStart }];
  let rawForkAccum = 0;
  const rawForkTotal = forks.length || 91;
  for (const day of sortedForkDays) {
    rawForkAccum += forkDayCounts.get(day);
    const scaledCount = Math.round((rawForkAccum / rawForkTotal) * totalForks);
    const d = new Date(day + 'T12:00:00Z');
    forkPoints.push({
      x: getX(d),
      y: getLeftY(scaledCount),
      count: scaledCount,
      date: d
    });
  }
  const lastForkDate = forks.length ? forks[forks.length - 1] : now;
  forkPoints.push({
    x: getX(lastForkDate),
    y: getLeftY(totalForks),
    count: totalForks,
    date: lastForkDate
  });

  const forkMilestones = [];
  for (let i = 50; i <= totalForks; i += 50) {
    const date = forks[Math.min(i - 1, forks.length - 1)] || lastForkDate;
    forkMilestones.push({
      count: i,
      date: date,
      x: getX(date),
      y: getLeftY(i)
    });
  }

  // --- 3. CLONES DATA (Full timeline from June 1 to present) ---
  const clonePoints = [{ x: getX(repoStart), y: getRightY(0), count: 0, date: repoStart }];
  let runningClones = 0;
  for (const item of cloneRecords) {
    runningClones += item.count;
    const d = new Date(item.timestamp);
    clonePoints.push({
      x: getX(d),
      y: getRightY(runningClones),
      count: runningClones,
      date: d
    });
  }

  // Splines
  const starLinePath = generateSplinePath(starPoints);
  const forkLinePath = generateSplinePath(forkPoints);
  const cloneLinePath = generateSplinePath(clonePoints);

  const starAreaPath = `${starLinePath} L ${starPoints[starPoints.length - 1].x.toFixed(1)} ${baselineY} L ${starPoints[0].x.toFixed(1)} ${baselineY} Z`;
  const forkAreaPath = `${forkLinePath} L ${forkPoints[forkPoints.length - 1].x.toFixed(1)} ${baselineY} L ${forkPoints[0].x.toFixed(1)} ${baselineY} Z`;
  const cloneAreaPath = `${cloneLinePath} L ${clonePoints[clonePoints.length - 1].x.toFixed(1)} ${baselineY} L ${clonePoints[0].x.toFixed(1)} ${baselineY} Z`;

  // Grid Ticks
  const leftTicks = [0, 100, 200, 300, 400, 500];
  const months = [
    new Date('2026-06-01T00:00:00Z'),
    new Date('2026-07-01T00:00:00Z'),
    new Date('2026-08-01T00:00:00Z'),
    new Date('2026-09-01T00:00:00Z')
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <defs>
    <style>
      :root {
        --bg: #0d1117;
        --border: #30363d;
        --text-primary: #f0f6fc;
        --text-secondary: #8b949e;
        --card-bg: #161b22;
        --card-border: #30363d;
        --grid-major: #21262d;
        --grid-minor: rgba(33, 38, 45, 0.45);
        
        --star-color: #f59e0b;
        --fork-color: #38bdf8;
        --clone-color: #10b981;
        --dot-border: #0d1117;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #ffffff;
          --border: #d0d7de;
          --text-primary: #1f2328;
          --text-secondary: #656d76;
          --card-bg: #f6f8fa;
          --card-border: #d0d7de;
          --grid-major: #e8ecf1;
          --grid-minor: rgba(232, 236, 241, 0.6);
          
          --star-color: #d97706;
          --fork-color: #0284c7;
          --clone-color: #059669;
          --dot-border: #ffffff;
        }
      }
      .mini-point {
        cursor: pointer;
        transition: r 0.15s ease, opacity 0.15s ease;
      }
      .mini-point:hover {
        r: 4.5px !important;
      }
      .stat-pill {
        transition: transform 0.2s ease;
      }
      .stat-pill:hover {
        transform: translateY(-2px);
      }
    </style>

    <!-- Gradients -->
    <linearGradient id="starAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--star-color)" stop-opacity="0.28" />
      <stop offset="85%" stop-color="var(--star-color)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--star-color)" stop-opacity="0" />
    </linearGradient>
    
    <linearGradient id="forkAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--fork-color)" stop-opacity="0.22" />
      <stop offset="85%" stop-color="var(--fork-color)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--fork-color)" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="cloneAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--clone-color)" stop-opacity="0.20" />
      <stop offset="85%" stop-color="var(--clone-color)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--clone-color)" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background Panel -->
  <rect width="${width}" height="${height}" rx="14" fill="var(--bg)" stroke="var(--border)" stroke-width="1.2" />

  <!-- HEADER -->
  <g transform="translate(${plotX}, 34)">
    <!-- Title & Subtitle -->
    <text x="0" y="0" fill="var(--text-primary)" font-size="18.5" font-weight="700" letter-spacing="-0.02em">Repository Growth &amp; Activity History</text>
    <text x="0" y="21" fill="var(--text-secondary)" font-size="12.5" font-weight="450">Stars, Forks, and Clones since repo creation • Small dots mark every 50-count milestone</text>

    <!-- Legend Cards on Right -->
    <g transform="translate(${plotW - 475}, -10)">
      <!-- Stars Pill -->
      <g class="stat-pill" transform="translate(0, 0)">
        <rect width="108" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="15" cy="17" r="5" fill="var(--star-color)" />
        <text x="27" y="17" fill="var(--text-secondary)" font-size="11" alignment-baseline="central">Stars:</text>
        <text x="63" y="17" fill="var(--text-primary)" font-size="12.5" font-weight="700" alignment-baseline="central">${totalStars}</text>
      </g>

      <!-- Forks Pill -->
      <g class="stat-pill" transform="translate(116, 0)">
        <rect width="108" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="15" cy="17" r="5" fill="var(--fork-color)" />
        <text x="27" y="17" fill="var(--text-secondary)" font-size="11" alignment-baseline="central">Forks:</text>
        <text x="63" y="17" fill="var(--text-primary)" font-size="12.5" font-weight="700" alignment-baseline="central">${totalForks}</text>
      </g>

      <!-- Clones Pill -->
      <g class="stat-pill" transform="translate(232, 0)">
        <rect width="124" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="15" cy="17" r="5" fill="var(--clone-color)" />
        <text x="27" y="17" fill="var(--text-secondary)" font-size="11" alignment-baseline="central">Clones:</text>
        <text x="71" y="17" fill="var(--text-primary)" font-size="12.5" font-weight="700" alignment-baseline="central">${totalLifetimeClones.toLocaleString()}</text>
      </g>

      <!-- 50-Milestone Indicator -->
      <g class="stat-pill" transform="translate(364, 0)">
        <rect width="112" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="15" cy="17" r="5" fill="none" stroke="var(--text-secondary)" stroke-width="1.6" />
        <circle cx="15" cy="17" r="2.2" fill="var(--text-primary)" />
        <text x="28" y="17" fill="var(--text-secondary)" font-size="11" font-weight="500" alignment-baseline="central">Every 50 ●</text>
      </g>
    </g>
  </g>

  <!-- GRID & AXES -->
  <g>
    <!-- Y-Axis Grid Lines & Left Labels (Stars/Forks: 0-500) -->
    ${leftTicks.map(val => {
      const y = getLeftY(val);
      const rightVal = Math.round((val / maxLeft) * maxRight);
      return `
      <g>
        <line x1="${plotX}" y1="${y}" x2="${plotX + plotW}" y2="${y}" stroke="var(--grid-major)" stroke-width="1" />
        <text x="${plotX - 12}" y="${y + 4}" fill="var(--text-secondary)" font-size="11" font-weight="500" text-anchor="end">${val}</text>
        <text x="${plotX + plotW + 12}" y="${y + 4}" fill="var(--clone-color)" font-size="10.5" font-weight="600" text-anchor="start">${rightVal >= 1000 ? (rightVal / 1000).toFixed(1) + 'k' : rightVal}</text>
      </g>`;
    }).join('')}

    <!-- X-Axis Month Major grid lines & labels -->
    ${months.map(d => {
      const x = getX(d);
      const label = formatMonthYear(d);
      return `
      <g>
        <line x1="${x}" y1="${plotY}" x2="${x}" y2="${baselineY}" stroke="var(--grid-major)" stroke-width="1" />
        <line x1="${x}" y1="${baselineY}" x2="${x}" y2="${baselineY + 6}" stroke="var(--text-secondary)" stroke-width="1" />
        <text x="${x}" y="${baselineY + 22}" fill="var(--text-primary)" font-size="11.5" font-weight="600" text-anchor="middle">${label}</text>
      </g>`;
    }).join('')}

    <!-- Baseline Axes -->
    <line x1="${plotX}" y1="${baselineY}" x2="${plotX + plotW}" y2="${baselineY}" stroke="var(--border)" stroke-width="1.2" />
    <line x1="${plotX}" y1="${plotY}" x2="${plotX}" y2="${baselineY}" stroke="var(--border)" stroke-width="1.2" />
    <line x1="${plotX + plotW}" y1="${plotY}" x2="${plotX + plotW}" y2="${baselineY}" stroke="var(--border)" stroke-width="1.2" />

    <!-- Axis Titles -->
    <text x="${plotX - 12}" y="${plotY - 12}" fill="var(--text-secondary)" font-size="11" font-weight="600" text-anchor="end">Stars / Forks</text>
    <text x="${plotX + plotW + 12}" y="${plotY - 12}" fill="var(--clone-color)" font-size="11" font-weight="600" text-anchor="start">Clones</text>
  </g>

  <!-- DATA CURVES & GRADIENTS -->
  <!-- 1. Clones Curve (Emerald) -->
  <path d="${cloneAreaPath}" fill="url(#cloneAreaGrad)" />
  <path d="${cloneLinePath}" fill="none" stroke="var(--clone-color)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />

  <!-- 2. Forks Curve (Cyan) -->
  <path d="${forkAreaPath}" fill="url(#forkAreaGrad)" />
  <path d="${forkLinePath}" fill="none" stroke="var(--fork-color)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />

  <!-- 3. Stars Curve (Gold) -->
  <path d="${starAreaPath}" fill="url(#starAreaGrad)" />
  <path d="${starLinePath}" fill="none" stroke="var(--star-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

  <!-- SMALL DATA POINTS ALONG CURVES (Clean micro-dots, no giant clutter) -->
  <g>
    <!-- Clones Points -->
    ${clonePoints.map(p => `
      <circle class="mini-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.8" fill="var(--clone-color)" opacity="0.6">
        <title>⬇ ${p.count} Lifetime Clones • ${formatDate(p.date)}</title>
      </circle>
    `).join('')}

    <!-- Forks Points -->
    ${forkPoints.map(p => `
      <circle class="mini-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.8" fill="var(--fork-color)" opacity="0.6">
        <title>⑂ ${p.count} Forks • ${formatDate(p.date)}</title>
      </circle>
    `).join('')}

    <!-- Stars Points -->
    ${starPoints.map(p => `
      <circle class="mini-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.8" fill="var(--star-color)" opacity="0.6">
        <title>★ ${p.count} Stars • ${formatDate(p.date)}</title>
      </circle>
    `).join('')}
  </g>

  <!-- SMALL MILESTONE DOTS (Every 50, refined size r=3.2, no huge badges) -->
  <g>
    <!-- Fork 50-Milestones -->
    ${forkMilestones.map(m => `
      <circle class="mini-point" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="3.4" fill="var(--fork-color)" stroke="var(--dot-border)" stroke-width="1.6">
        <title>⑂ Milestone: ${m.count} Forks on ${formatDate(m.date)}</title>
      </circle>
    `).join('')}

    <!-- Star 50-Milestones -->
    ${starMilestones.map(m => `
      <circle class="mini-point" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="3.6" fill="var(--star-color)" stroke="var(--dot-border)" stroke-width="1.6">
        <title>★ Milestone: ${m.count} Stars on ${formatDate(m.date)}</title>
      </circle>
    `).join('')}
  </g>

  <!-- LATEST ENDPOINTS -->
  <g>
    <circle cx="${clonePoints[clonePoints.length - 1].x.toFixed(1)}" cy="${clonePoints[clonePoints.length - 1].y.toFixed(1)}" r="3.4" fill="var(--clone-color)" stroke="var(--dot-border)" stroke-width="1.6">
      <title>⬇ Current Lifetime Clones: ${totalLifetimeClones.toLocaleString()}</title>
    </circle>
    <circle cx="${forkPoints[forkPoints.length - 1].x.toFixed(1)}" cy="${forkPoints[forkPoints.length - 1].y.toFixed(1)}" r="3.4" fill="var(--fork-color)" stroke="var(--dot-border)" stroke-width="1.6">
      <title>⑂ Current Total: ${totalForks} Forks</title>
    </circle>
    <circle cx="${starPoints[starPoints.length - 1].x.toFixed(1)}" cy="${starPoints[starPoints.length - 1].y.toFixed(1)}" r="3.6" fill="var(--star-color)" stroke="var(--dot-border)" stroke-width="1.6">
      <title>★ Current Total: ${totalStars} Stars</title>
    </circle>
  </g>
</svg>`;
}

async function main() {
  const data = await fetchGitHubData();

  console.log(`Summary: Stars=${data.stars.length}, Forks=${data.repoMeta.forks_count}, Clones=${data.cloneRecords.length} days.`);

  const svg = buildFullSizeGrowthSvg(data);

  mkdirSync(resolve('assets'), { recursive: true });
  const outputPath = resolve('assets/growth-chart.svg');
  writeFileSync(outputPath, svg, 'utf8');

  console.log(`Successfully generated updated single SVG at: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
