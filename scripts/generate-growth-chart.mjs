import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function fetchGitHubTimestamps() {
  console.log('Fetching stargazers and forks from GitHub API...');

  let starsRaw = '';
  let forksRaw = '';

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

  return { stars, forks };
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
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function buildSingleChartSvg({ stars, forks }) {
  // Dimensions
  const width = 940;
  const height = 510;
  const padLeft = 70;
  const padRight = 45;
  const padTop = 100;
  const padBottom = 65;

  const plotX = padLeft;
  const plotY = padTop;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const baselineY = plotY + plotH;

  // Time range calculation
  const repoStart = new Date('2026-06-01T00:00:00Z');
  const now = new Date('2026-09-13T00:00:00Z');
  const tMin = repoStart.getTime();
  const tMax = now.getTime();
  const timeSpan = tMax - tMin;

  // Max value calculation for Y axis
  const maxVal = Math.max(500, Math.ceil(stars.length / 100) * 100);

  const getX = (date) => {
    const t = typeof date === 'number' ? date : date.getTime();
    const ratio = Math.max(0, Math.min(1, (t - tMin) / timeSpan));
    return plotX + ratio * plotW;
  };

  const getY = (val) => {
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return baselineY - ratio * plotH;
  };

  // Build daily series
  function buildTimelineSeries(dates) {
    if (!dates.length) return [];
    const points = [{ x: getX(repoStart), y: getY(0), date: repoStart, count: 0 }];

    const dayCounts = new Map();
    for (const d of dates) {
      const key = d.toISOString().split('T')[0];
      dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
    }

    const sortedDays = Array.from(dayCounts.keys()).sort();
    let accum = 0;
    for (const day of sortedDays) {
      accum += dayCounts.get(day);
      const d = new Date(day + 'T12:00:00Z');
      points.push({
        x: getX(d),
        y: getY(accum),
        date: d,
        count: accum
      });
    }

    const lastDate = dates[dates.length - 1];
    points.push({
      x: getX(lastDate),
      y: getY(dates.length),
      date: lastDate,
      count: dates.length
    });

    return points;
  }

  const starSeries = buildTimelineSeries(stars);
  const forkSeries = buildTimelineSeries(forks);

  // Curves
  const starLinePath = generateSplinePath(starSeries);
  const forkLinePath = generateSplinePath(forkSeries);

  const starAreaPath = starSeries.length ? `${starLinePath} L ${starSeries[starSeries.length - 1].x.toFixed(1)} ${baselineY} L ${starSeries[0].x.toFixed(1)} ${baselineY} Z` : '';
  const forkAreaPath = forkSeries.length ? `${forkLinePath} L ${forkSeries[forkSeries.length - 1].x.toFixed(1)} ${baselineY} L ${forkSeries[0].x.toFixed(1)} ${baselineY} Z` : '';

  // Milestone points (Every 50)
  function getMilestones(dates, step = 50) {
    const milestones = [];
    for (let i = step; i <= dates.length; i += step) {
      const date = dates[i - 1];
      milestones.push({
        count: i,
        date: date,
        x: getX(date),
        y: getY(i)
      });
    }
    return milestones;
  }

  const starMilestones = getMilestones(stars, 50);
  const forkMilestones = getMilestones(forks, 50);

  // Month markers on X-Axis
  const months = [
    new Date('2026-06-01T00:00:00Z'),
    new Date('2026-07-01T00:00:00Z'),
    new Date('2026-08-01T00:00:00Z'),
    new Date('2026-09-01T00:00:00Z'),
  ];

  const midMonths = [
    new Date('2026-06-15T00:00:00Z'),
    new Date('2026-07-15T00:00:00Z'),
    new Date('2026-08-15T00:00:00Z'),
  ];

  const yTicks = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <defs>
    <!-- Dynamic theme styling via CSS -->
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
        --star-glow: rgba(245, 158, 11, 0.35);
        --fork-color: #38bdf8;
        --fork-glow: rgba(56, 189, 248, 0.35);
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
          --star-glow: rgba(217, 119, 6, 0.25);
          --fork-color: #0284c7;
          --fork-glow: rgba(2, 132, 199, 0.25);
          --dot-border: #ffffff;
        }
      }
      .milestone-node {
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .milestone-node:hover circle.main-dot {
        r: 8px;
      }
      .hit-point {
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.15s ease, r 0.15s ease;
      }
      .hit-point:hover {
        opacity: 1;
        r: 6.5px;
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
      <stop offset="0%" stop-color="var(--star-color)" stop-opacity="0.32" />
      <stop offset="80%" stop-color="var(--star-color)" stop-opacity="0.03" />
      <stop offset="100%" stop-color="var(--star-color)" stop-opacity="0" />
    </linearGradient>
    
    <linearGradient id="forkAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--fork-color)" stop-opacity="0.28" />
      <stop offset="80%" stop-color="var(--fork-color)" stop-opacity="0.03" />
      <stop offset="100%" stop-color="var(--fork-color)" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background Panel -->
  <rect width="${width}" height="${height}" rx="14" fill="var(--bg)" stroke="var(--border)" stroke-width="1.2" />

  <!-- HEADER -->
  <g transform="translate(${plotX}, 34)">
    <!-- Title & Subtitle -->
    <text x="0" y="0" fill="var(--text-primary)" font-size="18.5" font-weight="700" letter-spacing="-0.02em">Stars &amp; Forks Growth History</text>
    <text x="0" y="21" fill="var(--text-secondary)" font-size="12.5" font-weight="450">Tracked over time on same axis • Large dots highlight every 50-count milestone</text>

    <!-- Legend Cards on Right -->
    <g transform="translate(${plotW - 370}, -10)">
      <!-- Stars Pill -->
      <g class="stat-pill" transform="translate(0, 0)">
        <rect width="116" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="16" cy="17" r="5.5" fill="var(--star-color)" />
        <text x="29" y="17" fill="var(--text-secondary)" font-size="11" alignment-baseline="central">Stars:</text>
        <text x="66" y="17" fill="var(--text-primary)" font-size="12.5" font-weight="700" alignment-baseline="central">${stars.length}</text>
      </g>

      <!-- Forks Pill -->
      <g class="stat-pill" transform="translate(126, 0)">
        <rect width="114" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="16" cy="17" r="5.5" fill="var(--fork-color)" />
        <text x="29" y="17" fill="var(--text-secondary)" font-size="11" alignment-baseline="central">Forks:</text>
        <text x="67" y="17" fill="var(--text-primary)" font-size="12.5" font-weight="700" alignment-baseline="central">${forks.length}</text>
      </g>

      <!-- 50-Milestone Indicator -->
      <g class="stat-pill" transform="translate(250, 0)">
        <rect width="120" height="34" rx="7" fill="var(--card-bg)" stroke="var(--card-border)" stroke-width="1" />
        <circle cx="16" cy="17" r="7" fill="none" stroke="var(--text-secondary)" stroke-width="1.8" />
        <circle cx="16" cy="17" r="3" fill="var(--text-primary)" />
        <text x="30" y="17" fill="var(--text-secondary)" font-size="11" font-weight="500" alignment-baseline="central">Every 50 ●</text>
      </g>
    </g>
  </g>

  <!-- GRID & AXES -->
  <g>
    <!-- Y-Axis Grid Lines & Labels -->
    ${yTicks.map(val => {
      const y = getY(val);
      const isMajor = val % 100 === 0;
      return `
      <g>
        <line x1="${plotX}" y1="${y}" x2="${plotX + plotW}" y2="${y}" stroke="${isMajor ? 'var(--grid-major)' : 'var(--grid-minor)'}" stroke-width="${isMajor ? '1' : '0.75'}" ${!isMajor ? 'stroke-dasharray="3,3"' : ''} />
        ${isMajor ? `<text x="${plotX - 12}" y="${y + 4}" fill="var(--text-secondary)" font-size="11" font-weight="500" text-anchor="end">${val}</text>` : ''}
      </g>`;
    }).join('')}

    <!-- X-Axis Mid-Month subtle grid lines -->
    ${midMonths.map(d => {
      const x = getX(d);
      return `<line x1="${x}" y1="${plotY}" x2="${x}" y2="${baselineY}" stroke="var(--grid-minor)" stroke-width="0.75" stroke-dasharray="3,3" />`;
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

    <!-- Axis Titles -->
    <text x="${plotX - 12}" y="${plotY - 12}" fill="var(--text-secondary)" font-size="11" font-weight="600" text-anchor="end">Count</text>
    <text x="${plotX + plotW}" y="${baselineY + 22}" fill="var(--text-secondary)" font-size="11" font-weight="600" text-anchor="end">Timeline (Date)</text>
  </g>

  <!-- DATA CURVES & GRADIENTS -->
  <!-- Forks Curve Area & Line -->
  <path d="${forkAreaPath}" fill="url(#forkAreaGrad)" />
  <path d="${forkLinePath}" fill="none" stroke="var(--fork-color)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Stars Curve Area & Line -->
  <path d="${starAreaPath}" fill="url(#starAreaGrad)" />
  <path d="${starLinePath}" fill="none" stroke="var(--star-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

  <!-- INTERACTIVE HIT POINTS ALONG CURVES (Tooltips for date & counts) -->
  <g>
    ${forkSeries.map(p => `
      <circle class="hit-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="var(--fork-color)" stroke="var(--dot-border)" stroke-width="1.8">
        <title>⑂ ${p.count} Forks • ${formatDate(p.date)}</title>
      </circle>
    `).join('')}

    ${starSeries.map(p => `
      <circle class="hit-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="var(--star-color)" stroke="var(--dot-border)" stroke-width="1.8">
        <title>★ ${p.count} Stars • ${formatDate(p.date)}</title>
      </circle>
    `).join('')}
  </g>

  <!-- BIG DOTS FOR EVERY 50 MILESTONES -->
  <!-- Fork Milestones (every 50) -->
  <g>
    ${forkMilestones.map(m => `
      <g class="milestone-node">
        <circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="13" fill="var(--fork-glow)" />
        <circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="9" fill="none" stroke="var(--fork-color)" stroke-width="1.6" stroke-opacity="0.75" />
        <circle class="main-dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="6" fill="var(--fork-color)" stroke="var(--dot-border)" stroke-width="2.2">
          <title>⑂ Milestone: ${m.count} Forks on ${formatDate(m.date)}</title>
        </circle>
        
        <!-- Badge -->
        <g transform="translate(${m.x.toFixed(1)}, ${(m.y - 18).toFixed(1)})">
          <rect x="-19" y="-12" width="38" height="18" rx="4.5" fill="var(--card-bg)" stroke="var(--fork-color)" stroke-width="1.2" />
          <text x="0" y="-3" fill="var(--text-primary)" font-size="9.5" font-weight="700" text-anchor="middle">⑂ ${m.count}</text>
        </g>
      </g>
    `).join('')}
  </g>

  <!-- Star Milestones (every 50) -->
  <g>
    ${starMilestones.map(m => {
      const labelOffsetY = (m.count % 100 === 0) ? -18 : 20;
      return `
      <g class="milestone-node">
        <circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="14" fill="var(--star-glow)" />
        <circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="9.5" fill="none" stroke="var(--star-color)" stroke-width="1.8" stroke-opacity="0.75" />
        <circle class="main-dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="6.5" fill="var(--star-color)" stroke="var(--dot-border)" stroke-width="2.2">
          <title>★ Milestone: ${m.count} Stars on ${formatDate(m.date)}</title>
        </circle>

        <!-- Badge -->
        <g transform="translate(${m.x.toFixed(1)}, ${(m.y + labelOffsetY).toFixed(1)})">
          <rect x="-21" y="-12" width="42" height="18" rx="4.5" fill="var(--card-bg)" stroke="var(--star-color)" stroke-width="1.2" />
          <text x="0" y="-3" fill="var(--text-primary)" font-size="9.5" font-weight="700" text-anchor="middle">★ ${m.count}</text>
        </g>
      </g>`;
    }).join('')}
  </g>

  <!-- LATEST ENDPOINT MARKERS -->
  <g>
    ${forkSeries.length ? `
      <circle cx="${forkSeries[forkSeries.length - 1].x.toFixed(1)}" cy="${forkSeries[forkSeries.length - 1].y.toFixed(1)}" r="5" fill="var(--fork-color)" stroke="var(--dot-border)" stroke-width="2">
        <title>Current Forks: ${forks.length} • ${formatDate(forkSeries[forkSeries.length - 1].date)}</title>
      </circle>
    ` : ''}

    ${starSeries.length ? `
      <circle cx="${starSeries[starSeries.length - 1].x.toFixed(1)}" cy="${starSeries[starSeries.length - 1].y.toFixed(1)}" r="5.5" fill="var(--star-color)" stroke="var(--dot-border)" stroke-width="2">
        <title>Current Stars: ${stars.length} • ${formatDate(starSeries[starSeries.length - 1].date)}</title>
      </circle>
    ` : ''}
  </g>
</svg>`;
}

async function main() {
  const { stars, forks } = fetchGitHubTimestamps();

  console.log(`Fetched ${stars.length} stars and ${forks.length} forks.`);

  const singleSvg = buildSingleChartSvg({ stars, forks });

  mkdirSync(resolve('assets'), { recursive: true });
  const outputPath = resolve('assets/growth-chart.svg');
  writeFileSync(outputPath, singleSvg, 'utf8');

  console.log(`Successfully generated single SVG at: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
