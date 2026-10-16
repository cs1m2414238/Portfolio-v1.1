document.addEventListener("DOMContentLoaded", () => {
  let tealCir, orangeCir, hardCir;
  let solvedCountEl, solvedLabelEl;
  let cardItems;

  const maxSegmentLength = 67;
  const fullTrackLength = 211.3;
  const totalCircumference = 251.3;

  // Category parameters for LeetCode circular arc gauge
  const stats = {
    easy: { solved: 80, total: 949, element: null, defaultOffset: 0, color: "#06b6d4", label: "Easy" },
    medium: { solved: 92, total: 2066, element: null, defaultOffset: -71, color: "#fbbf24", label: "Medium" },
    hard: { solved: 13, total: 942, element: null, defaultOffset: -142, color: "#ef4444", label: "Hard" }
  };

  let totalSolved = 387;
  let activeHoverKey = null;

  // ----------------------------------------------------
  // HTML Templates (All unified in 3-column card format)
  // ----------------------------------------------------

  const leetcodeTemplate = `
    <!-- Main Content Layout with 3 columns matching screenshot -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview (Circle Component + Legend) -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Problems Overview</div>

        <div class="gfg-problems-overview">
          <!-- Circular Arc Indicator (Older Circle Component) -->
          <div class="circle-indicator-wrapper">
            <svg class="leetcode-svg" viewBox="0 0 100 100">
              <circle id="graycircle" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.08)"
                stroke-width="6" stroke-dasharray="211.3 251.3" stroke-linecap="round"
                transform="rotate(120 50 50)" style="opacity: 0;" />
              <circle class="track-segment" id="easytrack" cx="50" cy="50" r="40" fill="none"
                stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" stroke-dasharray="67 251.3"
                stroke-dashoffset="0" stroke-linecap="round" transform="rotate(120 50 50)" />
              <circle class="track-segment" id="medtrack" cx="50" cy="50" r="40" fill="none"
                stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" stroke-dasharray="67 251.3"
                stroke-dashoffset="-71" stroke-linecap="round" transform="rotate(120 50 50)" />
              <circle class="track-segment" id="hardtrack" cx="50" cy="50" r="40" fill="none"
                stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" stroke-dasharray="67 251.3"
                stroke-dashoffset="-142" stroke-linecap="round" transform="rotate(120 50 50)" />
              <circle id="easycircle" cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" stroke-width="6"
                stroke-dasharray="67 251.3" stroke-dashoffset="0" stroke-linecap="round"
                transform="rotate(120 50 50)" />
              <circle id="medcircle" cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" stroke-width="6"
                stroke-dasharray="67 251.3" stroke-dashoffset="-71" stroke-linecap="round"
                transform="rotate(120 50 50)" />
              <circle id="hardcircle" cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="6"
                stroke-dasharray="67 251.3" stroke-dashoffset="-142" stroke-linecap="round"
                transform="rotate(120 50 50)" />
            </svg>

            <div class="circle-inner-content">
              <span class="solved-count">387</span>
              <span class="solved-label">Problems Solved</span>
            </div>
          </div>

          <!-- Difficulty Breakdown Legend with Colored Dots -->
          <div class="gfg-legend">
            <div class="gfg-legend-item diff-legend-item diff-easy" data-diff="easy">
              <span class="legend-dot easy"></span> Easy (80 / 949)
            </div>
            <div class="gfg-legend-item diff-legend-item diff-med" data-diff="medium">
              <span class="legend-dot medium"></span> Medium (92 / 2066)
            </div>
            <div class="gfg-legend-item diff-legend-item diff-hard" data-diff="hard">
              <span class="legend-dot hard"></span> Hard (13 / 942)
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Objective Coding Stats (4 Rows with Icons) -->
      <div class="panel-box">
        <div class="gfg-metrics-list">
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon score-icon"><i class="fa-solid fa-code"></i></div>
              <span class="gfg-metric-label">Contest Rating</span>
            </div>
            <span class="gfg-metric-val-pill pill-purple">1,847</span>
          </div>

          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon solved-icon"><i class="fa-solid fa-code-branch"></i></div>
              <span class="gfg-metric-label">Problems Solved</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-blue">387</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>

          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon rank-icon"><i class="fa-solid fa-graduation-cap"></i></div>
              <span class="gfg-metric-label">Global Rank</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-purple">#48,312</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>

          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon articles-icon"><i class="fa-regular fa-circle-check"></i></div>
              <span class="gfg-metric-label">Acceptance Rate</span>
            </div>
            <span class="gfg-metric-val-pill pill-green">68.4%</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Streaks Banner & Cards -->
      <div class="panel-box gfg-streaks-box">
        <div class="gfg-streak-banner">
          <div class="gfg-streak-banner-content">
            <div class="banner-fire-wrapper">
              <i class="fa-solid fa-fire banner-fire"></i>
            </div>
            <span class="gfg-banner-text">41 Days POTD Streak</span>
          </div>
        </div>

        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-calendar-days gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Longest Streak:</span>
            <span class="gfg-streak-value">41 Days</span>
          </div>
        </div>

        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-trophy gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Contest Standing:</span>
            <span class="gfg-streak-value">Knight · Top 4.8%</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const geeksforgeeksTemplate = `
    <!-- Main Content Layout with 3 columns for GFG matching screenshot -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Problems Overview</div>
        
        <div class="gfg-problems-overview">
          <div class="gfg-donut-wrapper">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="8" />
              <!-- Easy (3 problems) -> 75% of 251.3 circumference = 188.5 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="8" 
                      stroke-dasharray="188.5 251.3" stroke-linecap="butt" transform="rotate(-90 50 50)" />
              <!-- Medium (1 problem) -> 25% of 251.3 circumference = 62.8 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" stroke-width="8" 
                      stroke-dasharray="62.8 251.3" stroke-dashoffset="-188.5" stroke-linecap="butt" transform="rotate(-90 50 50)" />
            </svg>
            <div class="gfg-donut-text">
              <span class="gfg-solve-num">4</span>
              <span class="gfg-solve-lbl">Problems Solved</span>
            </div>
          </div>
          <div class="gfg-legend">
            <div class="gfg-legend-item"><span class="legend-dot school"></span> School (0)</div>
            <div class="gfg-legend-item"><span class="legend-dot basic"></span> Basic (0)</div>
            <div class="gfg-legend-item"><span class="legend-dot easy"></span> Easy (3)</div>
            <div class="gfg-legend-item"><span class="legend-dot medium"></span> Medium (1)</div>
            <div class="gfg-legend-item"><span class="legend-dot hard"></span> Hard (0)</div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Coding score & Metrics -->
      <div class="panel-box">
        <div class="gfg-metrics-list">
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon score-icon"><i class="fa-solid fa-code"></i></div>
              <span class="gfg-metric-label">Coding Score</span>
            </div>
            <span class="gfg-metric-val-pill pill-green">10</span>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon solved-icon"><i class="fa-solid fa-code-branch"></i></div>
              <span class="gfg-metric-label">Problems Solved</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-blue">4</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon rank-icon"><i class="fa-solid fa-graduation-cap"></i></div>
              <span class="gfg-metric-label">Institute Rank</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-purple">821</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon articles-icon"><i class="fa-solid fa-newspaper"></i></div>
              <span class="gfg-metric-label">Articles Published</span>
            </div>
            <span class="gfg-metric-val-pill pill-orange">0</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Streaks banner & cards -->
      <div class="panel-box gfg-streaks-box">
        <div class="gfg-streak-banner">
          <div class="gfg-streak-banner-content">
            <div class="banner-fire-wrapper">
              <i class="fa-solid fa-fire banner-fire"></i>
            </div>
            <span class="gfg-banner-text">1 Day POTD Streak</span>
          </div>
        </div>
        
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-calendar-days gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Longest Streak:</span>
            <span class="gfg-streak-value">1 Days</span>
          </div>
        </div>
        
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-trophy gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">POTDs Solved:</span>
            <span class="gfg-streak-value">1</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const codeforcesTemplate = `
    <!-- Main Content Layout with 3 columns for Codeforces -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Problems Overview</div>
        
        <div class="gfg-problems-overview">
          <div class="gfg-donut-wrapper">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="8" />
              <!-- Div 3/A: 95/184 = 51.6% of 251.3 = 129.7 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#38bdf8" stroke-width="8" 
                      stroke-dasharray="129.7 251.3" stroke-linecap="butt" transform="rotate(-90 50 50)" />
              <!-- Div 2/B: 73/184 = 39.6% of 251.3 = 99.5 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="8" 
                      stroke-dasharray="99.5 251.3" stroke-dashoffset="-129.7" stroke-linecap="butt" transform="rotate(-90 50 50)" />
              <!-- Div 1/C+: 16/184 = 8.7% of 251.3 = 21.8 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="8" 
                      stroke-dasharray="21.8 251.3" stroke-dashoffset="-229.2" stroke-linecap="butt" transform="rotate(-90 50 50)" />
            </svg>
            <div class="gfg-donut-text">
              <span class="gfg-solve-num">184</span>
              <span class="gfg-solve-lbl">Problems Solved</span>
            </div>
          </div>
          <div class="gfg-legend">
            <div class="gfg-legend-item"><span class="legend-dot easy" style="background:#38bdf8;"></span> Div 3 / A (95)</div>
            <div class="gfg-legend-item"><span class="legend-dot medium" style="background:#a855f7;"></span> Div 2 / B (73)</div>
            <div class="gfg-legend-item"><span class="legend-dot hard" style="background:#ef4444;"></span> Div 1 / C+ (16)</div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: Codeforces Metrics -->
      <div class="panel-box">
        <div class="gfg-metrics-list">
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon rank-icon"><i class="fa-solid fa-trophy"></i></div>
              <span class="gfg-metric-label">Contest Rating</span>
            </div>
            <span class="gfg-metric-val-pill pill-purple">1,420</span>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon solved-icon"><i class="fa-solid fa-code-branch"></i></div>
              <span class="gfg-metric-label">Problems Solved</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-blue">184</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon score-icon"><i class="fa-solid fa-chart-line"></i></div>
              <span class="gfg-metric-label">Max Rating</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-blue">1,450</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon articles-icon"><i class="fa-solid fa-stopwatch"></i></div>
              <span class="gfg-metric-label">Contests Played</span>
            </div>
            <span class="gfg-metric-val-pill pill-orange">45</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Standing & Streaks -->
      <div class="panel-box gfg-streaks-box">
        <div class="gfg-streak-banner" style="background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);">
          <div class="gfg-streak-banner-content">
            <div class="banner-fire-wrapper" style="background: rgba(255, 255, 255, 0.2);">
              <i class="fa-solid fa-star banner-fire" style="color: #fff; animation: none;"></i>
            </div>
            <span class="gfg-banner-text">Specialist Division</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-globe gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Global Rank:</span>
            <span class="gfg-streak-value">#24,115</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-medal gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Active Title:</span>
            <span class="gfg-streak-value">Specialist · Top 18%</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const codechefTemplate = `
    <!-- Main Content Layout with 3 columns for CodeChef -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Problems Overview</div>
        
        <div class="gfg-problems-overview">
          <div class="gfg-donut-wrapper">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="8" />
              <!-- Easy: 70/156 = 44.8% -> 112.7 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="8" 
                      stroke-dasharray="112.7 251.3" stroke-linecap="butt" transform="rotate(-90 50 50)" />
              <!-- Medium: 68/156 = 43.6% -> 109.5 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" stroke-width="8" 
                      stroke-dasharray="109.5 251.3" stroke-dashoffset="-112.7" stroke-linecap="butt" transform="rotate(-90 50 50)" />
              <!-- Hard: 18/156 = 11.5% -> 29.0 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="8" 
                      stroke-dasharray="29.0 251.3" stroke-dashoffset="-222.2" stroke-linecap="butt" transform="rotate(-90 50 50)" />
            </svg>
            <div class="gfg-donut-text">
              <span class="gfg-solve-num">156</span>
              <span class="gfg-solve-lbl">Problems Solved</span>
            </div>
          </div>
          <div class="gfg-legend">
            <div class="gfg-legend-item"><span class="legend-dot easy"></span> Easy (70)</div>
            <div class="gfg-legend-item"><span class="legend-dot medium"></span> Medium (68)</div>
            <div class="gfg-legend-item"><span class="legend-dot hard"></span> Hard (18)</div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: CodeChef Metrics -->
      <div class="panel-box">
        <div class="gfg-metrics-list">
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon score-icon"><i class="fa-solid fa-code"></i></div>
              <span class="gfg-metric-label">Contest Rating</span>
            </div>
            <span class="gfg-metric-val-pill pill-purple">1,850</span>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon solved-icon"><i class="fa-solid fa-code-branch"></i></div>
              <span class="gfg-metric-label">Problems Solved</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-blue">156</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon rank-icon"><i class="fa-solid fa-layer-group"></i></div>
              <span class="gfg-metric-label">Current Division</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-green">Div. 2</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon articles-icon"><i class="fa-solid fa-trophy"></i></div>
              <span class="gfg-metric-label">Global Rank</span>
            </div>
            <span class="gfg-metric-val-pill pill-orange">#12,840</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Standing & Streaks -->
      <div class="panel-box gfg-streaks-box">
        <div class="gfg-streak-banner" style="background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25);">
          <div class="gfg-streak-banner-content">
            <div class="banner-fire-wrapper" style="background: rgba(255, 255, 255, 0.2);">
              <i class="fa-solid fa-medal banner-fire" style="color: #fff; animation: none;"></i>
            </div>
            <span class="gfg-banner-text">4-Star Coder</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-fire gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Contest Streak:</span>
            <span class="gfg-streak-value">12 Contests</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-trophy gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Peak Rating:</span>
            <span class="gfg-streak-value">1,850 · Top 6%</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const hackerrankTemplate = `
    <!-- Main Content Layout with 3 columns for HackerRank -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Domain Proficiency</div>
        
        <div class="gfg-problems-overview">
          <div class="gfg-donut-wrapper">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="8" />
              <!-- Problem Solving: 71% of 251.3 = 178.4 -->
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="8" 
                      stroke-dasharray="178.4 251.3" stroke-linecap="butt" transform="rotate(-90 50 50)" />
            </svg>
            <div class="gfg-donut-text">
              <span class="gfg-solve-num">5★</span>
              <span class="gfg-solve-lbl">Problem Solving</span>
            </div>
          </div>
          <div class="gfg-legend">
            <div class="gfg-legend-item"><span class="legend-dot easy"></span> Python (4★)</div>
            <div class="gfg-legend-item"><span class="legend-dot basic"></span> SQL (4★)</div>
            <div class="gfg-legend-item"><span class="legend-dot medium"></span> Algorithms (5★)</div>
            <div class="gfg-legend-item"><span class="legend-dot school"></span> Java (4★)</div>
          </div>
        </div>
      </div>

      <!-- Middle Panel: HackerRank Metrics -->
      <div class="panel-box">
        <div class="gfg-metrics-list">
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon rank-icon"><i class="fa-solid fa-trophy"></i></div>
              <span class="gfg-metric-label">Global Rank</span>
            </div>
            <span class="gfg-metric-val-pill pill-blue">#7,241</span>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon score-icon"><i class="fa-solid fa-bolt"></i></div>
              <span class="gfg-metric-label">Total Score</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-green">2,840</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row clickable">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon solved-icon"><i class="fa-solid fa-star"></i></div>
              <span class="gfg-metric-label">Star Level</span>
            </div>
            <div class="gfg-metric-right">
              <span class="gfg-metric-val-pill pill-purple">5★ Gold</span>
              <i class="fa-solid fa-chevron-right chevron"></i>
            </div>
          </div>
          <div class="gfg-metric-row">
            <div class="gfg-metric-left">
              <div class="gfg-metric-icon articles-icon"><i class="fa-solid fa-certificate"></i></div>
              <span class="gfg-metric-label">Domains Badged</span>
            </div>
            <span class="gfg-metric-val-pill pill-orange">6 Domains</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Streaks & Badges -->
      <div class="panel-box gfg-streaks-box">
        <div class="gfg-streak-banner" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);">
          <div class="gfg-streak-banner-content">
            <div class="banner-fire-wrapper" style="background: rgba(255, 255, 255, 0.2);">
              <i class="fa-brands fa-hackerrank banner-fire" style="color: #fff; animation: none;"></i>
            </div>
            <span class="gfg-banner-text">Gold Level Coder</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-calendar-check gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Practice Streak:</span>
            <span class="gfg-streak-value">30 Days</span>
          </div>
        </div>
        <div class="gfg-streak-card">
          <div class="gfg-streak-icon-box">
            <i class="fa-solid fa-award gfg-streak-icon-gold"></i>
          </div>
          <div class="gfg-streak-details">
            <span class="gfg-streak-label">Total Badges:</span>
            <span class="gfg-streak-value">6 Verified</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // ----------------------------------------------------
  // Platform Profile Link Metadata
  // ----------------------------------------------------

  const platformLinks = {
    leetcode: {
      url: "https://leetcode.com/u/9sY5neJGk8/",
      label: "View LeetCode Profile"
    },
    geeksforgeeks: {
      url: "https://www.geeksforgeeks.org/user/cs1m2414238/",
      label: "View GeeksforGeeks Profile"
    },
    codeforces: {
      url: "https://codeforces.com/profile/Unexpectedpriyanshu",
      label: "View Codeforces Profile"
    },
    codechef: {
      url: "https://www.codechef.com/users/cs1m2414238",
      label: "View CodeChef Profile"
    },
    hackerrank: {
      url: "https://www.hackerrank.com/cs1m2414238",
      label: "View HackerRank Profile"
    }
  };

  // ----------------------------------------------------
  // DOM Elements Setup & Bindings
  // ----------------------------------------------------

  function setupDOMElements() {
    tealCir = document.getElementById("easycircle");
    orangeCir = document.getElementById("medcircle");
    hardCir = document.getElementById("hardcircle");
    
    solvedCountEl = document.querySelector(".circle-inner-content .solved-count");
    solvedLabelEl = document.querySelector(".circle-inner-content .solved-label");
    cardItems = document.querySelectorAll(".diff-legend-item");

    if (stats.easy) stats.easy.element = tealCir;
    if (stats.medium) stats.medium.element = orangeCir;
    if (stats.hard) stats.hard.element = hardCir;
  }

  function parseStatsFromCards() {
    if (!cardItems || cardItems.length === 0) return;
    totalSolved = 0;

    cardItems.forEach((card) => {
      const isEasy = card.classList.contains("diff-easy") || card.dataset.diff === "easy";
      const isMed = card.classList.contains("diff-med") || card.dataset.diff === "medium";
      const isHard = card.classList.contains("diff-hard") || card.dataset.diff === "hard";

      const text = card.textContent.trim();
      const match = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return;
      
      const solved = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      
      totalSolved += solved;
      
      if (isEasy) {
        stats.easy.solved = solved;
        stats.easy.total = total;
      } else if (isMed) {
        stats.medium.solved = solved;
        stats.medium.total = total;
      } else if (isHard) {
        stats.hard.solved = solved;
        stats.hard.total = total;
      }
    });

    if (totalSolved === 0) totalSolved = 387;
  }

  function killAllTweens() {
    if (typeof gsap === "undefined") return;
    gsap.killTweensOf([
      tealCir, 
      orangeCir, 
      hardCir, 
      "#graycircle", 
      ".track-segment"
    ]);
  }

  function showDefaultState() {
    if (typeof gsap === "undefined") return;
    killAllTweens();
    if (!tealCir) return;

    if (solvedCountEl) solvedCountEl.textContent = "387";
    if (solvedLabelEl) {
      solvedLabelEl.innerHTML = `Problems Solved`;
    }

    gsap.to("#graycircle", { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(".track-segment", { opacity: 1, duration: 0.3, ease: "power2.out" });

    Object.keys(stats).forEach((key) => {
      const item = stats[key];
      if (!item.element) return;
      const percentage = item.total > 0 ? (item.solved / item.total) : 0;
      const len = Math.min(Math.max(percentage, 0), 1) * maxSegmentLength;

      gsap.to(item.element, {
        "stroke-dasharray": `${len} ${totalCircumference}`,
        "stroke-dashoffset": item.defaultOffset,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    });
  }

  function showHoverState(activeKey) {
    if (typeof gsap === "undefined") return;
    killAllTweens();
    if (!tealCir) return;

    const activeItem = stats[activeKey];
    if (!activeItem) return;

    if (solvedCountEl) solvedCountEl.textContent = activeItem.solved;
    if (solvedLabelEl) {
      solvedLabelEl.innerHTML = `<span style="color: ${activeItem.color}; font-weight: 700;">${activeItem.label} Solved</span>`;
    }

    gsap.to("#graycircle", { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(".track-segment", { opacity: 0, duration: 0.3, ease: "power2.out" });

    Object.keys(stats).forEach((key) => {
      const item = stats[key];
      if (!item.element) return;

      if (key === activeKey) {
        const percentage = item.total > 0 ? (item.solved / item.total) : 0;
        const fullLen = Math.min(Math.max(percentage, 0), 1) * fullTrackLength;

        gsap.to(item.element, {
          "stroke-dasharray": `${fullLen} ${totalCircumference}`,
          "stroke-dashoffset": 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      } else {
        gsap.to(item.element, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });
  }

  function bindHoverListeners() {
    if (!cardItems || cardItems.length === 0) return;
    cardItems.forEach((card) => {
      let key = card.dataset.diff;
      if (!key) {
        if (card.classList.contains("diff-easy")) key = "easy";
        else if (card.classList.contains("diff-med")) key = "medium";
        else if (card.classList.contains("diff-hard")) key = "hard";
      }

      if (!key) return;

      card.addEventListener("mouseenter", () => {
        activeHoverKey = key;
        showHoverState(key);
      });

      card.addEventListener("mouseleave", () => {
        if (activeHoverKey === key) {
          activeHoverKey = null;
          requestAnimationFrame(() => {
            if (activeHoverKey === null) {
              showDefaultState();
            }
          });
        }
      });
    });
  }

  // ----------------------------------------------------
  // Dynamic Content Swapper
  // ----------------------------------------------------

  function updatePlatform(key) {
    const container = document.getElementById("stats-tab-content");
    if (!container) return;

    // 1. Synchronize Tab active states
    const tabs = document.querySelectorAll(".stats-card .tab");
    tabs.forEach((tab) => {
      const tabKey = (tab.dataset.platform || tab.textContent.replace("✦", "").trim()).toLowerCase();
      tab.classList.toggle("active", tabKey === key);
    });

    // 2. Synchronize Quick Profile Strip Cards
    const stripCards = document.querySelectorAll(".profile-strip-card");
    stripCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.platform === key);
    });

    // 3. Update "View Profile" link href and button text
    const linkBtn = document.getElementById("stats-profile-link");
    if (linkBtn && platformLinks[key]) {
      linkBtn.href = platformLinks[key].url;
      const span = linkBtn.querySelector("span");
      if (span) span.textContent = platformLinks[key].label;
    }

    // 4. Render corresponding platform template
    if (key === "geeksforgeeks") {
      container.innerHTML = geeksforgeeksTemplate;
    } else if (key === "codeforces") {
      container.innerHTML = codeforcesTemplate;
    } else if (key === "codechef") {
      container.innerHTML = codechefTemplate;
    } else if (key === "hackerrank") {
      container.innerHTML = hackerrankTemplate;
    } else {
      // Default: LeetCode
      container.innerHTML = leetcodeTemplate;
      setupDOMElements();
      parseStatsFromCards();
      bindHoverListeners();
      showDefaultState();
    }
  }

  // Bind tab click events
  const tabs = document.querySelectorAll(".stats-card .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const key = (tab.dataset.platform || tab.textContent.replace("✦", "").trim()).toLowerCase();
      updatePlatform(key);
    });
  });

  // Bind profile strip card click events
  const stripCards = document.querySelectorAll(".profile-strip-card");
  stripCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Do not override if user clicked direct profile link icon inside strip card
      if (e.target.closest(".profile-strip-link")) return;
      const key = card.dataset.platform;
      if (key) updatePlatform(key);
    });
  });

  // Initial load execution (LeetCode default)
  setupDOMElements();
  parseStatsFromCards();
  bindHoverListeners();
  showDefaultState();
});
