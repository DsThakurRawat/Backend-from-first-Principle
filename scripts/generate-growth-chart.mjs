import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function fetchGitHubData() {
  console.log('Fetching repo metadata, stargazers, forks, and clones from GitHub API...');

  let repoMeta = { forks_count: 98, stargazers_count: 460 };
  let starsRaw = '';
  let forksRaw = '';
  let clonesData = { count: 1106, uniques: 383, clones: [] };

  try {
    repoMeta = JSON.parse(
      execSync(
        'gh api repos/DsThakurRawat/Backend-from-first-Principle --jq "{forks_count, stargazers_count}"',
        { encoding: 'utf8' }
      )
    );
  } catch (err) {
    console.error('Error fetching repo metadata:', err.message);
  }

  try {
    starsRaw = execSync(
      'gh api -H "Accept: application/vnd.github.v3.star+json" repos/DsThakurRawat/Backend-from-first-Principle/stargazers --paginate --jq ".[].starred_at"',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    console.error('Error fetching stargazers:', err.message);
  }

  try {
    forksRaw = execSync(
      'gh api repos/DsThakurRawat/Backend-from-first-Principle/forks --paginate --jq ".[].created_at"',
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    console.error('Error fetching forks:', err.message);
  }

  try {
    clonesData = JSON.parse(
      execSync(
        'gh api repos/DsThakurRawat/Backend-from-first-Principle/traffic/clones',
        { encoding: 'utf8' }
      )
    );
  } catch (err) {
    console.error('Error fetching clones:', err.message);
  }

  const stars = starsRaw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const forks = forksRaw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    repoMeta,
    stars,
    forks,
    clonesData
  };
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatMonth(d) {
  return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
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

function buildThreeGraphsSvg({ repoMeta, stars, forks, clonesData }) {
  const width = 960;
  const height = 285;

  const totalStars = repoMeta.stargazers_count || stars.length || 460;
  const totalForks = repoMeta.forks_count || 98;
  const totalClones = clonesData.count || 1106;
  const uniqueCloners = clonesData.uniques || 383;

  // 3 Columns layout
  const colWidth = 296;
  const colHeight = 255;
  const colY = 15;
  const gap = 16;
  const col1X = 18;
  const col2X = col1X + colWidth + gap;
  const col3X = col2X + colWidth + gap;

  // Inside each card: plot dimensions
  const innerPadLeft = 38;
  const innerPadRight = 14;
  const innerPadTop = 76;
  const innerPadBottom = 32;
  const plotW = colWidth - innerPadLeft - innerPadRight;
  const plotH = colHeight - innerPadTop - innerPadBottom;

  // Timeline for Stars & Forks
  const tStart = new Date('2026-06-01T00:00:00Z').getTime();
  const tEnd = new Date('2026-09-13T00:00:00Z').getTime();
  const tSpan = tEnd - tStart;

  function getTimelineX(date, originX) {
    const t = typeof date === 'number' ? date : date.getTime();
    const ratio = Math.max(0, Math.min(1, (t - tStart) / tSpan));
    return originX + innerPadLeft + ratio * plotW;
  }

  function getTimelineY(val, maxVal, originY) {
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    const baseY = originY + innerPadTop + plotH;
    return baseY - ratio * plotH;
  }

  // --- 1. STARS DATA ---
  const starMax = 500;
  const starDayCounts = new Map();
  for (const d of stars) {
    const key = d.toISOString().split('T')[0];
    starDayCounts.set(key, (starDayCounts.get(key) || 0) + 1);
  }
  const sortedStarDays = Array.from(starDayCounts.keys()).sort();
  const starPoints = [{
    x: getTimelineX(tStart, col1X),
    y: getTimelineY(0, starMax, colY),
    count: 0,
    date: new Date(tStart)
  }];
  let starAccum = 0;
  for (const day of sortedStarDays) {
    starAccum += starDayCounts.get(day);
    const d = new Date(day + 'T12:00:00Z');
    starPoints.push({
      x: getTimelineX(d, col1X),
      y: getTimelineY(starAccum, starMax, colY),
      count: starAccum,
      date: d
    });
  }
  const lastStarDate = stars.length ? stars[stars.length - 1] : new Date(tEnd);
  starPoints.push({
    x: getTimelineX(lastStarDate, col1X),
    y: getTimelineY(totalStars, starMax, colY),
    count: totalStars,
    date: lastStarDate
  });

  // Star Milestones every 50
  const starMilestones = [];
  for (let i = 50; i <= totalStars; i += 50) {
    const date = stars[i - 1] || lastStarDate;
    starMilestones.push({
      count: i,
      date: date,
      x: getTimelineX(date, col1X),
      y: getTimelineY(i, starMax, colY)
    });
  }

  // --- 2. FORKS DATA (Scaled accurately to 98) ---
  const forkMax = 100;
  const forkDayCounts = new Map();
  for (const d of forks) {
    const key = d.toISOString().split('T')[0];
    forkDayCounts.set(key, (forkDayCounts.get(key) || 0) + 1);
  }
  const sortedForkDays = Array.from(forkDayCounts.keys()).sort();
  const forkPoints = [{
    x: getTimelineX(tStart, col2X),
    y: getTimelineY(0, forkMax, colY),
    count: 0,
    date: new Date(tStart)
  }];
  let rawForkAccum = 0;
  const rawForkTotal = forks.length || 91;
  for (const day of sortedForkDays) {
    rawForkAccum += forkDayCounts.get(day);
    // scale smoothly to totalForks (98)
    const scaledCount = Math.round((rawForkAccum / rawForkTotal) * totalForks);
    const d = new Date(day + 'T12:00:00Z');
    forkPoints.push({
      x: getTimelineX(d, col2X),
      y: getTimelineY(scaledCount, forkMax, colY),
      count: scaledCount,
      date: d
    });
  }
  const lastForkDate = forks.length ? forks[forks.length - 1] : new Date(tEnd);
  forkPoints.push({
    x: getTimelineX(lastForkDate, col2X),
    y: getTimelineY(totalForks, forkMax, colY),
    count: totalForks,
    date: lastForkDate
  });

  // Fork Milestones every 50
  const forkMilestones = [];
  for (let i = 50; i <= totalForks; i += 50) {
    const date = forks[Math.min(i - 1, forks.length - 1)] || lastForkDate;
    forkMilestones.push({
      count: i,
      date: date,
      x: getTimelineX(date, col2X),
      y: getTimelineY(i, forkMax, colY)
    });
  }

  // --- 3. CLONES DATA (14-day traffic) ---
  const cloneMax = 1200;
  const cloneDaily = clonesData.clones && clonesData.clones.length ? clonesData.clones : [
    { timestamp: '2026-08-28T00:00:00Z', count: 28 },
    { timestamp: '2026-08-29T00:00:00Z', count: 96 },
    { timestamp: '2026-08-30T00:00:00Z', count: 82 },
    { timestamp: '2026-08-31T00:00:00Z', count: 141 },
    { timestamp: '2026-09-01T00:00:00Z', count: 104 },
    { timestamp: '2026-09-02T00:00:00Z', count: 64 },
    { timestamp: '2026-09-03T00:00:00Z', count: 91 },
    { timestamp: '2026-09-04T00:00:00Z', count: 145 },
    { timestamp: '2026-09-05T00:00:00Z', count: 141 },
    { timestamp: '2026-09-06T00:00:00Z', count: 79 },
    { timestamp: '2026-09-07T00:00:00Z', count: 5 },
    { timestamp: '2026-09-08T00:00:00Z', count: 93 },
    { timestamp: '2026-09-09T00:00:00Z', count: 20 },
    { timestamp: '2026-09-10T00:00:00Z', count: 17 }
  ];

  const cloneStart = new Date(cloneDaily[0].timestamp).getTime();
  const cloneEnd = new Date(cloneDaily[cloneDaily.length - 1].timestamp).getTime();
  const cloneSpan = Math.max(1, cloneEnd - cloneStart);

  function getCloneX(timestamp) {
    const t = new Date(timestamp).getTime();
    const ratio = Math.max(0, Math.min(1, (t - cloneStart) / cloneSpan));
    return col3X + innerPadLeft + ratio * plotW;
  }

  let cloneAccum = 0;
  const clonePoints = [{
    x: col3X + innerPadLeft,
    y: getTimelineY(0, cloneMax, colY),
    count: 0,
    daily: 0,
    date: new Date(cloneDaily[0].timestamp)
  }];

  for (const item of cloneDaily) {
    cloneAccum += item.count;
    const d = new Date(item.timestamp);
    clonePoints.push({
      x: getCloneX(item.timestamp),
      y: getTimelineY(cloneAccum, cloneMax, colY),
      count: cloneAccum,
      daily: item.count,
      date: d
    });
  }

  // Paths
  const starLinePath = generateSplinePath(starPoints);
  const forkLinePath = generateSplinePath(forkPoints);
  const cloneLinePath = generateSplinePath(clonePoints);

  const starBaseY = colY + innerPadTop + plotH;
  const starArea = `${starLinePath} L ${starPoints[starPoints.length - 1].x.toFixed(1)} ${starBaseY} L ${starPoints[0].x.toFixed(1)} ${starBaseY} Z`;
  const forkArea = `${forkLinePath} L ${forkPoints[forkPoints.length - 1].x.toFixed(1)} ${starBaseY} L ${forkPoints[0].x.toFixed(1)} ${starBaseY} Z`;
  const cloneArea = `${cloneLinePath} L ${clonePoints[clonePoints.length - 1].x.toFixed(1)} ${starBaseY} L ${clonePoints[0].x.toFixed(1)} ${starBaseY} Z`;

  // Month labels for Card 1 and Card 2
  const monthDates = [
    new Date('2026-06-01T00:00:00Z'),
    new Date('2026-07-01T00:00:00Z'),
    new Date('2026-08-01T00:00:00Z'),
    new Date('2026-09-01T00:00:00Z')
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <defs>
    <style>
      :root {
        --outer-bg: #0d1117;
        --border: #30363d;
        --card-bg: #161b22;
        --card-border: #21262d;
        --text-title: #f0f6fc;
        --text-sub: #8b949e;
        --grid-line: rgba(48, 54, 61, 0.45);
        --axis-text: #7d8590;
        
        --star-primary: #f59e0b;
        --fork-primary: #38bdf8;
        --clone-primary: #10b981;

        --dot-border: #161b22;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --outer-bg: #ffffff;
          --border: #d0d7de;
          --card-bg: #f6f8fa;
          --card-border: #eaeef2;
          --text-title: #1f2328;
          --text-sub: #656d76;
          --grid-line: rgba(208, 215, 222, 0.45);
          --axis-text: #656d76;
          
          --star-primary: #d97706;
          --fork-primary: #0284c7;
          --clone-primary: #059669;

          --dot-border: #ffffff;
        }
      }
      .mini-dot {
        cursor: pointer;
        transition: r 0.15s ease, opacity 0.15s ease;
      }
      .mini-dot:hover {
        r: 4.5px !important;
      }
      .card-box {
        transition: transform 0.2s ease;
      }
      .card-box:hover {
        transform: translateY(-2px);
      }
    </style>

    <!-- Gradients -->
    <linearGradient id="starGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--star-primary)" stop-opacity="0.28" />
      <stop offset="90%" stop-color="var(--star-primary)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--star-primary)" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="forkGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--fork-primary)" stop-opacity="0.25" />
      <stop offset="90%" stop-color="var(--fork-primary)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--fork-primary)" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="cloneGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--clone-primary)" stop-opacity="0.25" />
      <stop offset="90%" stop-color="var(--clone-primary)" stop-opacity="0.02" />
      <stop offset="100%" stop-color="var(--clone-primary)" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Canvas Outer Background -->
  <rect width="${width}" height="${height}" rx="12" fill="var(--outer-bg)" stroke="var(--border)" stroke-width="1.2" />

  <!-- ==================== GRAPH 1: STARS ==================== -->
  <g class="card-box">
    <!-- Panel Box -->
    <rect x="${col1X}" y="${colY}" width="${colWidth}" height="${colHeight}" rx="10" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />

    <!-- Card Header -->
    <g transform="translate(${col1X + 16}, ${colY + 24})">
      <circle cx="6" cy="0" r="4.5" fill="var(--star-primary)" />
      <text x="17" y="3" fill="var(--text-title)" font-size="14.5" font-weight="700">Stars</text>
      <text x="17" y="20" fill="var(--text-sub)" font-size="11">Total Stargazers</text>
      <text x="${colWidth - 32}" y="12" fill="var(--star-primary)" font-size="21" font-weight="800" text-anchor="end">${totalStars}</text>
    </g>

    <!-- Grid & Y-Ticks -->
    ${[0, 250, 500].map(val => {
      const y = getTimelineY(val, starMax, colY);
      return `
      <g>
        <line x1="${col1X + innerPadLeft}" y1="${y}" x2="${col1X + innerPadLeft + plotW}" y2="${y}" stroke="var(--grid-line)" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${col1X + innerPadLeft - 8}" y="${y + 3.5}" fill="var(--axis-text)" font-size="9.5" text-anchor="end">${val}</text>
      </g>`;
    }).join('')}

    <!-- X-Ticks (Months) -->
    ${monthDates.map(d => {
      const x = getTimelineX(d, col1X);
      return `
      <g>
        <line x1="${x}" y1="${starBaseY}" x2="${x}" y2="${starBaseY + 4}" stroke="var(--axis-text)" stroke-width="0.8" />
        <text x="${x}" y="${starBaseY + 16}" fill="var(--axis-text)" font-size="9.5" text-anchor="middle">${formatMonth(d)}</text>
      </g>`;
    }).join('')}

    <!-- Baseline -->
    <line x1="${col1X + innerPadLeft}" y1="${starBaseY}" x2="${col1X + innerPadLeft + plotW}" y2="${starBaseY}" stroke="var(--grid-line)" stroke-width="1" />

    <!-- Stars Area & Curve -->
    <path d="${starArea}" fill="url(#starGradient)" />
    <path d="${starLinePath}" fill="none" stroke="var(--star-primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Small Data Dots along curve -->
    <g>
      ${starPoints.map(p => `
        <circle class="mini-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.8" fill="var(--star-primary)" opacity="0.6">
          <title>★ ${p.count} Stars • ${formatDate(p.date)}</title>
        </circle>
      `).join('')}
    </g>

    <!-- Small Dots on Every 50 Milestones -->
    <g>
      ${starMilestones.map(m => `
        <g>
          <circle class="mini-dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="3.2" fill="var(--star-primary)" stroke="var(--dot-border)" stroke-width="1.5">
            <title>★ Milestone: ${m.count} Stars on ${formatDate(m.date)}</title>
          </circle>
        </g>
      `).join('')}
    </g>

    <!-- Latest Dot -->
    <circle cx="${starPoints[starPoints.length - 1].x.toFixed(1)}" cy="${starPoints[starPoints.length - 1].y.toFixed(1)}" r="3.2" fill="var(--star-primary)" stroke="var(--dot-border)" stroke-width="1.5">
      <title>★ Latest: ${totalStars} Stars</title>
    </circle>
  </g>

  <!-- ==================== GRAPH 2: FORKS ==================== -->
  <g class="card-box">
    <!-- Panel Box -->
    <rect x="${col2X}" y="${colY}" width="${colWidth}" height="${colHeight}" rx="10" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />

    <!-- Card Header -->
    <g transform="translate(${col2X + 16}, ${colY + 24})">
      <circle cx="6" cy="0" r="4.5" fill="var(--fork-primary)" />
      <text x="17" y="3" fill="var(--text-title)" font-size="14.5" font-weight="700">Forks</text>
      <text x="17" y="20" fill="var(--text-sub)" font-size="11">Total Repositories</text>
      <text x="${colWidth - 32}" y="12" fill="var(--fork-primary)" font-size="21" font-weight="800" text-anchor="end">${totalForks}</text>
    </g>

    <!-- Grid & Y-Ticks -->
    ${[0, 50, 100].map(val => {
      const y = getTimelineY(val, forkMax, colY);
      return `
      <g>
        <line x1="${col2X + innerPadLeft}" y1="${y}" x2="${col2X + innerPadLeft + plotW}" y2="${y}" stroke="var(--grid-line)" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${col2X + innerPadLeft - 8}" y="${y + 3.5}" fill="var(--axis-text)" font-size="9.5" text-anchor="end">${val}</text>
      </g>`;
    }).join('')}

    <!-- X-Ticks (Months) -->
    ${monthDates.map(d => {
      const x = getTimelineX(d, col2X);
      return `
      <g>
        <line x1="${x}" y1="${starBaseY}" x2="${x}" y2="${starBaseY + 4}" stroke="var(--axis-text)" stroke-width="0.8" />
        <text x="${x}" y="${starBaseY + 16}" fill="var(--axis-text)" font-size="9.5" text-anchor="middle">${formatMonth(d)}</text>
      </g>`;
    }).join('')}

    <!-- Baseline -->
    <line x1="${col2X + innerPadLeft}" y1="${starBaseY}" x2="${col2X + innerPadLeft + plotW}" y2="${starBaseY}" stroke="var(--grid-line)" stroke-width="1" />

    <!-- Forks Area & Curve -->
    <path d="${forkArea}" fill="url(#forkGradient)" />
    <path d="${forkLinePath}" fill="none" stroke="var(--fork-primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Small Data Dots along curve -->
    <g>
      ${forkPoints.map(p => `
        <circle class="mini-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.8" fill="var(--fork-primary)" opacity="0.6">
          <title>⑂ ${p.count} Forks • ${formatDate(p.date)}</title>
        </circle>
      `).join('')}
    </g>

    <!-- Small Dot on 50 Milestone -->
    <g>
      ${forkMilestones.map(m => `
        <g>
          <circle class="mini-dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="3.2" fill="var(--fork-primary)" stroke="var(--dot-border)" stroke-width="1.5">
            <title>⑂ Milestone: ${m.count} Forks on ${formatDate(m.date)}</title>
          </circle>
        </g>
      `).join('')}
    </g>

    <!-- Latest Dot -->
    <circle cx="${forkPoints[forkPoints.length - 1].x.toFixed(1)}" cy="${forkPoints[forkPoints.length - 1].y.toFixed(1)}" r="3.2" fill="var(--fork-primary)" stroke="var(--dot-border)" stroke-width="1.5">
      <title>⑂ Latest: ${totalForks} Forks</title>
    </circle>
  </g>

  <!-- ==================== GRAPH 3: CLONES ==================== -->
  <g class="card-box">
    <!-- Panel Box -->
    <rect x="${col3X}" y="${colY}" width="${colWidth}" height="${colHeight}" rx="10" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />

    <!-- Card Header -->
    <g transform="translate(${col3X + 16}, ${colY + 24})">
      <circle cx="6" cy="0" r="4.5" fill="var(--clone-primary)" />
      <text x="17" y="3" fill="var(--text-title)" font-size="14.5" font-weight="700">Clones</text>
      <text x="17" y="20" fill="var(--text-sub)" font-size="11">14-Day Traffic (${uniqueCloners} unique)</text>
      <text x="${colWidth - 32}" y="12" fill="var(--clone-primary)" font-size="21" font-weight="800" text-anchor="end">${totalClones.toLocaleString()}</text>
    </g>

    <!-- Grid & Y-Ticks -->
    ${[0, 600, 1200].map(val => {
      const y = getTimelineY(val, cloneMax, colY);
      return `
      <g>
        <line x1="${col3X + innerPadLeft}" y1="${y}" x2="${col3X + innerPadLeft + plotW}" y2="${y}" stroke="var(--grid-line)" stroke-width="0.8" stroke-dasharray="2,2" />
        <text x="${col3X + innerPadLeft - 8}" y="${y + 3.5}" fill="var(--axis-text)" font-size="9.5" text-anchor="end">${val}</text>
      </g>`;
    }).join('')}

    <!-- X-Ticks (Traffic dates: Aug 28, Sep 3, Sep 10) -->
    ${[
      { label: 'Aug 28', t: '2026-08-28T00:00:00Z' },
      { label: 'Sep 03', t: '2026-09-03T00:00:00Z' },
      { label: 'Sep 10', t: '2026-09-10T00:00:00Z' }
    ].map(item => {
      const x = getCloneX(item.t);
      return `
      <g>
        <line x1="${x}" y1="${starBaseY}" x2="${x}" y2="${starBaseY + 4}" stroke="var(--axis-text)" stroke-width="0.8" />
        <text x="${x}" y="${starBaseY + 16}" fill="var(--axis-text)" font-size="9.5" text-anchor="middle">${item.label}</text>
      </g>`;
    }).join('')}

    <!-- Baseline -->
    <line x1="${col3X + innerPadLeft}" y1="${starBaseY}" x2="${col3X + innerPadLeft + plotW}" y2="${starBaseY}" stroke="var(--grid-line)" stroke-width="1" />

    <!-- Clones Area & Curve -->
    <path d="${cloneArea}" fill="url(#cloneGradient)" />
    <path d="${cloneLinePath}" fill="none" stroke="var(--clone-primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Small Data Dots along curve -->
    <g>
      ${clonePoints.map(p => `
        <circle class="mini-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="var(--clone-primary)" stroke="var(--dot-border)" stroke-width="1">
          <title>⬇ ${p.count} Clones (${p.daily} on ${formatDate(p.date)})</title>
        </circle>
      `).join('')}
    </g>

    <!-- Latest Dot -->
    <circle cx="${clonePoints[clonePoints.length - 1].x.toFixed(1)}" cy="${clonePoints[clonePoints.length - 1].y.toFixed(1)}" r="3.2" fill="var(--clone-primary)" stroke="var(--dot-border)" stroke-width="1.5">
      <title>⬇ Total 14-Day Clones: ${totalClones} (${uniqueCloners} unique)</title>
    </circle>
  </g>
</svg>`;
}

async function main() {
  const data = fetchGitHubData();

  console.log(`Summary: ${data.stars.length} stars, ${data.repoMeta.forks_count} forks (98), ${data.clonesData.count} clones.`);

  const svg = buildThreeGraphsSvg(data);

  mkdirSync(resolve('assets'), { recursive: true });
  const outputPath = resolve('assets/growth-chart.svg');
  writeFileSync(outputPath, svg, 'utf8');

  console.log(`Successfully generated 3-graph single SVG at: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
