document.addEventListener("DOMContentLoaded", () => {
  let tealCir, orangeCir, hardCir;
  let solvedCountEl, totalCountEl, solvedLabelEl;
  let cardItems;

  const maxSegmentLength = 67;
  const fullTrackLength = 211.3;
  const totalCircumference = 251.3;

  // Category parameters (updated when DOM elements are fetched)
  const stats = {
    easy: { solved: 80, total: 949, element: null, defaultOffset: 0, color: "#06b6d4", label: "Easy" },
    medium: { solved: 92, total: 2066, element: null, defaultOffset: -71, color: "#fbbf24", label: "Medium" },
    hard: { solved: 13, total: 942, element: null, defaultOffset: -142, color: "#ef4444", label: "Hard" }
  };

  let totalSolved = 0;
  let totalProblems = 0;
  let activeHoverKey = null;

  // ----------------------------------------------------
  // HTML Templates
  // ----------------------------------------------------

  const leetcodeTemplate = `
    <!-- Upper Stats Summary Metrics Box Grid -->
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value val-orange">48,312</div>
        <div class="stat-label">Global Rank</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-green">387</div>
        <div class="stat-label">Problems Solved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-blue">1,847</div>
        <div class="stat-label">Contest Rating</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-orange">41</div>
        <div class="stat-label">Streak (Days)</div>
      </div>
    </div>

    <!-- Main Content Layout splits Split Columns -->
    <div class="main-content">
      <!-- Left Panel: Solve Rate -->
      <div class="panel-box">
        <div class="box-header">Solve Rate · Arc Display</div>
        
        <div class="solve-rate-container">
          <!-- Left Column (Circle) -->
          <div class="solve-rate-left">
            <!-- Circular Arc Indicator -->
            <div class="circle-indicator-wrapper">
              <svg class="leetcode-svg" viewBox="0 0 100 100">
                <!-- Background Track with bottom gap (continuous, hidden by default) -->
                <circle id="graycircle" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" 
                        stroke-dasharray="211.3 251.3" stroke-linecap="round"
                        transform="rotate(120 50 50)" style="opacity: 0;" />
                <!-- Background Track Segments with cuts (visible by default) -->
                <circle class="track-segment" id="easytrack" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="0" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
                <circle class="track-segment" id="medtrack" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="-71" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
                <circle class="track-segment" id="hardtrack" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="-142" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
                <!-- Easy Arc (green/teal) -->
                <circle id="easycircle" cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="0" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
                <!-- Medium Arc (yellow) -->
                <circle id="medcircle" cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="-71" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
                <!-- Hard Arc (red) -->
                <circle id="hardcircle" cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="6" 
                        stroke-dasharray="67 251.3" stroke-dashoffset="-142" stroke-linecap="round" 
                        transform="rotate(120 50 50)" />
              </svg>

              <!-- Inner stats overlay -->
              <div class="circle-inner-content">
                <div style="display: flex; align-items: baseline; justify-content: center; gap: 2px;">
                  <span class="solved-count">185</span>
                  <span class="total-count">/3957</span>
                </div>
                <div class="solved-label">
                  <i class="fa-solid fa-check" style="color: #22c55e; font-size: 0.75rem;"></i> Solved
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (Cards) -->
          <div class="solve-rate-right">
            <!-- Stacked Difficulty Cards -->
            <div class="difficulty-cards-stack">
              <!-- Easy -->
              <div class="diff-card-item">
                <span class="card-label-easy">Easy</span>
                <span class="card-values">80<span>/949</span></span>
              </div>

              <!-- Medium -->
              <div class="diff-card-item">
                <span class="card-label-medium">Med.</span>
                <span class="card-values">92<span>/2066</span></span>
              </div>

              <!-- Hard -->
              <div class="diff-card-item">
                <span class="card-label-hard">Hard</span>
                <span class="card-values">13<span>/942</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Badges -->
      <div class="panel-box">
        <div class="box-header">LeetCode Badges</div>
        
        <div class="badges-container">
          <!-- Knight Badge -->
          <div class="badge-item badge-knight">
            <div class="badge-icon-knight">
              <i class="fa-solid fa-chess-knight"></i>
            </div>
            <div class="badge-name">Knight</div>
            <div class="badge-desc">Contest Rating Top 4.8%</div>
          </div>

          <!-- Streak Badge -->
          <div class="badge-item badge-streak">
            <div class="badge-icon-streak">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <div class="badge-name">50 Days (2025)</div>
            <div class="badge-desc">Consecutive coding streak</div>
          </div>
        </div>

        <div class="meta-row">
          <span class="meta-label">Acceptance Rate</span>
          <span class="meta-val-blue">68.4%</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Contest Rank</span>
          <span class="meta-val-orange">Knight</span>
        </div>
      </div>
    </div>
  `;

  const hackerrankTemplate = `
    <!-- Upper Stats Summary Metrics Box Grid -->
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value val-blue" style="color: #06b6d4; text-shadow: 0 0 10px rgba(6, 182, 212, 0.25);">7,241</div>
        <div class="stat-label">Global Rank</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-green" style="color: #22c55e; text-shadow: 0 0 10px rgba(34, 197, 94, 0.25);">2,840</div>
        <div class="stat-label">Total Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-orange" style="color: #fbbf24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.25);">5<span style="color: #fbbf24; font-size: 0.85em; margin-left: 2px;">★</span></div>
        <div class="stat-label">Star Level</div>
      </div>
      <div class="stat-card">
        <div class="stat-value val-blue" style="color: #38bdf8; text-shadow: 0 0 10px rgba(56, 189, 248, 0.25);">6</div>
        <div class="stat-label">Domains</div>
      </div>
    </div>

    <!-- Main Content Layout splits Split Columns -->
    <div class="main-content">
      <!-- Left Panel: Domain Proficiency Matrix -->
      <div class="panel-box">
        <div class="box-header">Domain Proficiency · Star Matrix</div>
        
        <div class="hackerrank-matrix-container">
          <!-- Row 1: Problem Solving -->
          <div class="matrix-row">
            <span class="matrix-name">Problem Solving</span>
            <span class="matrix-stars">★★★★★</span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-green-fill" style="width: 88.5%;"></div>
            </div>
            <span class="matrix-score hr-green">620</span>
          </div>
          
          <!-- Row 2: Python -->
          <div class="matrix-row">
            <span class="matrix-name">Python</span>
            <span class="matrix-stars">★★★★<span class="star-empty">★</span></span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-cyan-fill" style="width: 81.4%;"></div>
            </div>
            <span class="matrix-score hr-cyan">440</span>
          </div>
          
          <!-- Row 3: SQL -->
          <div class="matrix-row">
            <span class="matrix-name">SQL</span>
            <span class="matrix-stars">★★★★<span class="star-empty">★</span></span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-orange-fill" style="width: 81.2%;"></div>
            </div>
            <span class="matrix-score hr-orange">390</span>
          </div>
          
          <!-- Row 4: JavaScript -->
          <div class="matrix-row">
            <span class="matrix-name">JavaScript</span>
            <span class="matrix-stars">★★★<span class="star-empty">★★</span></span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-yellow-fill" style="width: 64.5%;"></div>
            </div>
            <span class="matrix-score hr-yellow">310</span>
          </div>
          
          <!-- Row 5: Algorithms -->
          <div class="matrix-row">
            <span class="matrix-name">Algorithms</span>
            <span class="matrix-stars">★★★★★</span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-purple-fill" style="width: 82.8%;"></div>
            </div>
            <span class="matrix-score hr-purple">580</span>
          </div>
          
          <!-- Row 6: Data Structures -->
          <div class="matrix-row">
            <span class="matrix-name">Data Structures</span>
            <span class="matrix-stars">★★★★<span class="star-empty">★</span></span>
            <div class="matrix-bar-bg">
              <div class="matrix-bar-fill hr-blue-fill" style="width: 83.3%;"></div>
            </div>
            <span class="matrix-score hr-blue">500</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Score & Breakdown stacked/side-by-side -->
      <div class="panel-box" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div class="box-header">Total Score &amp; Domain Breakdown</div>
        
        <div class="hackerrank-right-content">
          <!-- Score Circle Left -->
          <div class="hackerrank-score-circle-wrapper">
            <div class="circle-indicator-wrapper">
              <svg class="hackerrank-svg" viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <!-- Background Circle -->
                <circle class="track-segment" cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="6" 
                        stroke-dasharray="211.3 251.3" stroke-linecap="round" transform="rotate(120 50 50)" />
                <!-- Green Glow Arc (Score / Max Score = 2840 / 4000 = 71%) -->
                <circle id="hackerrank-score-circle" cx="50" cy="50" r="40" fill="none" stroke="#22c55e" stroke-width="6" 
                        stroke-dasharray="0 251.3" stroke-linecap="round" transform="rotate(120 50 50)" />
              </svg>
              
              <!-- Inner Text -->
              <div class="circle-inner-content">
                <div class="score-val">2840</div>
                <div class="score-total">/ 4,000</div>
              </div>
            </div>
            <div class="score-footer">
              SCORE <span>out of 4000</span>
            </div>
          </div>
          
          <!-- Breakdown List Right -->
          <div class="breakdown-list">
            <!-- Item 1: Problem Solving -->
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-label hr-green">Problem Solving</span>
                <span class="breakdown-val">620<span>/700</span></span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill hr-green-fill" style="width: 88.5%;"></div>
              </div>
            </div>
            
            <!-- Item 2: Python -->
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-label hr-cyan">Python</span>
                <span class="breakdown-val">440<span>/540</span></span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill hr-cyan-fill" style="width: 81.4%;"></div>
              </div>
            </div>
            
            <!-- Item 3: SQL -->
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-label hr-orange">SQL</span>
                <span class="breakdown-val">390<span>/480</span></span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill hr-orange-fill" style="width: 81.2%;"></div>
              </div>
            </div>
            
            <!-- Item 4: JavaScript -->
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-label hr-yellow">JavaScript</span>
                <span class="breakdown-val">310<span>/480</span></span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill hr-yellow-fill" style="width: 64.5%;"></div>
              </div>
            </div>
            
            <!-- Item 5: Algorithms -->
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-label hr-purple">Algorithms</span>
                <span class="breakdown-val">580<span>/700</span></span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill hr-purple-fill" style="width: 82.8%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- My Badges Section -->
    <div class="hackerrank-badges-section">
      <div class="badges-title-row">
        <i class="fa-solid fa-award"></i>
        <span class="badges-title">My Badges</span>
      </div>
      <div class="badges-grid">
        <!-- Badge 1: Problem Solving -->
        <div class="badge-hexagon-wrapper">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <i class="fa-solid fa-cubes"></i>
              </div>
              <div class="badge-label">Problem Solving</div>
              <div class="badge-stars">★★★</div>
            </div>
          </div>
        </div>

        <!-- Badge 2: CPP -->
        <div class="badge-hexagon-wrapper">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <span class="badge-text-icon">C++</span>
              </div>
              <div class="badge-label">CPP</div>
              <div class="badge-stars">★★★</div>
            </div>
          </div>
        </div>

        <!-- Badge 3: Java -->
        <div class="badge-hexagon-wrapper">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <i class="fa-brands fa-java" style="font-size: 1.8rem;"></i>
              </div>
              <div class="badge-label">Java</div>
              <div class="badge-stars">★★★★</div>
            </div>
          </div>
        </div>

        <!-- Badge 4: Python -->
        <div class="badge-hexagon-wrapper">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <i class="fa-brands fa-python"></i>
              </div>
              <div class="badge-label">Python</div>
              <div class="badge-stars">★★★</div>
            </div>
          </div>
        </div>

        <!-- Badge 5: C Language -->
        <div class="badge-hexagon-wrapper">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <span class="badge-text-icon">C</span>
              </div>
              <div class="badge-label">C language</div>
              <div class="badge-stars">★★★★</div>
            </div>
          </div>
        </div>

        <!-- Badge 6: Ruby (Peach styled) -->
        <div class="badge-hexagon-wrapper badge-ruby">
          <div class="badge-hexagon-border">
            <div class="badge-hexagon-inner">
              <div class="badge-icon">
                <i class="fa-solid fa-gem" style="transform: rotate(-10deg);"></i>
              </div>
              <div class="badge-label">Ruby</div>
              <div class="badge-stars">★</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const geeksforgeeksTemplate = `
    <!-- Main Content Layout with 3 columns for GFG -->
    <div class="main-content gfg-three-columns">
      <!-- Left Panel: Problems Overview -->
      <div class="panel-box">
        <div class="box-header gfg-centered-header">Problems Overview</div>
        
        <div class="gfg-problems-overview">
          <div class="gfg-donut-wrapper">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <!-- Background Circle -->
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

  // ----------------------------------------------------
  // Platform Data for LeetCode-style content
  // ----------------------------------------------------

  const platformData = {
    leetcode: {
      metrics: [
        { value: "48,312", label: "Global Rank", class: "val-orange" },
        { value: "387", label: "Problems Solved", class: "val-green" },
        { value: "1,847", label: "Contest Rating", class: "val-blue" },
        { value: "41", label: "Streak (Days)", class: "val-orange" }
      ],
      solveRate: {
        easy: "80/949",
        medium: "92/2066",
        hard: "13/942"
      },
      badgesHeader: "LeetCode Badges",
      badges: [
        { icon: '<i class="fa-solid fa-chess-knight"></i>', name: "Knight", desc: "Contest Rating Top 4.8%" },
        { icon: '<i class="fa-solid fa-calendar-check"></i>', name: "50 Days (2025)", desc: "Consecutive coding streak" }
      ],
      acceptance: "68.4%",
      rank: "Knight"
    },
    codeforces: {
      metrics: [
        { value: "24,115", label: "Global Rank", class: "val-orange" },
        { value: "184", label: "Problems Solved", class: "val-green" },
        { value: "1,420", label: "Contest Rating", class: "val-blue" },
        { value: "45", label: "Contests Played", class: "val-orange" }
      ],
      solveRate: {
        easy: "95/200",
        medium: "73/350",
        hard: "16/150"
      },
      badgesHeader: "Codeforces Badges",
      badges: [
        { icon: '<i class="fa-solid fa-star"></i>', name: "Specialist", desc: "Active Contest Rating: 1420" },
        { icon: '<i class="fa-solid fa-trophy"></i>', name: "Max Rating", desc: "Peak rating: 1450" }
      ],
      acceptance: "52.8%",
      rank: "Specialist"
    },
    codechef: {
      metrics: [
        { value: "12,840", label: "Global Rank", class: "val-orange" },
        { value: "156", label: "Problems Solved", class: "val-green" },
        { value: "1,850", label: "Contest Rating", class: "val-blue" },
        { value: "Div. 2", label: "Current Division", class: "val-orange" }
      ],
      solveRate: {
        easy: "70/120",
        medium: "68/220",
        hard: "18/90"
      },
      badgesHeader: "CodeChef Badges",
      badges: [
        { icon: '<i class="fa-solid fa-medal"></i>', name: "4-Star", desc: "Rating of 1850" },
        { icon: '<i class="fa-solid fa-circle-check"></i>', name: "Div. 2 Challenger", desc: "Consistent Div. 2 contestant" }
      ],
      acceptance: "58.1%",
      rank: "4-Star / Div 2"
    },
    geeksforgeeks: {
      metrics: [
        { value: "821", label: "Institute Rank", class: "val-orange" },
        { value: "4", label: "Problems Solved", class: "val-green" },
        { value: "10", label: "Coding Score", class: "val-blue" },
        { value: "1", label: "Streak (Days)", class: "val-orange" }
      ],
      solveRate: {
        easy: "3/400",
        medium: "1/600",
        hard: "0/250"
      },
      badgesHeader: "GFG Badges",
      badges: [
        { icon: '<i class="fa-solid fa-fire"></i>', name: "1 Day Streak", desc: "POTD streak maintained" },
        { icon: '<i class="fa-solid fa-award"></i>', name: "POTDs Solved", desc: "1 GFG POTD completed" }
      ],
      acceptance: "100%",
      rank: "Institute Rank: 821"
    }
  };

  // ----------------------------------------------------
  // DOM Elements Setup & Bindings
  // ----------------------------------------------------

  function setupDOMElements() {
    tealCir = document.getElementById("easycircle");
    orangeCir = document.getElementById("medcircle");
    hardCir = document.getElementById("hardcircle");
    
    solvedCountEl = document.querySelector(".solved-count");
    totalCountEl = document.querySelector(".total-count");
    solvedLabelEl = document.querySelector(".solved-label");
    cardItems = document.querySelectorAll(".diff-card-item");

    if (stats.easy) stats.easy.element = tealCir;
    if (stats.medium) stats.medium.element = orangeCir;
    if (stats.hard) stats.hard.element = hardCir;
  }

  function parseStatsFromCards() {
    if (!cardItems || cardItems.length === 0) return;
    totalSolved = 0;
    totalProblems = 0;

    cardItems.forEach((card) => {
      const labelEasy = card.querySelector(".card-label-easy");
      const labelMed = card.querySelector(".card-label-medium");
      const labelHard = card.querySelector(".card-label-hard");
      const valuesEl = card.querySelector(".card-values");
      
      if (!valuesEl) return;
      const match = valuesEl.textContent.trim().match(/(\d+)\s*\/\s*(\d+)/); // used to trim space regex
      if (!match) return;
      
      const solved = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      
      totalSolved += solved;
      totalProblems += total;
      
      if (labelEasy) {
        stats.easy.solved = solved;
        stats.easy.total = total;
      } else if (labelMed) {
        stats.medium.solved = solved;
        stats.medium.total = total;
      } else if (labelHard) {
        stats.hard.solved = solved;
        stats.hard.total = total;
      }
    });
  }

  function killAllTweens() {
    gsap.killTweensOf([
      tealCir, 
      orangeCir, 
      hardCir, 
      "#graycircle", 
      ".track-segment"
    ]);
  }

  function showDefaultState() {
    killAllTweens();
    if (!tealCir) return;

    if (solvedCountEl) solvedCountEl.textContent = totalSolved;
    if (totalCountEl) totalCountEl.textContent = `/${totalProblems}`;
    if (solvedLabelEl) {
      solvedLabelEl.innerHTML = `<i class="fa-solid fa-check" style="color: #22c55e; font-size: 0.75rem;"></i> Solved`;
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
    killAllTweens();
    if (!tealCir) return;

    const activeItem = stats[activeKey];
    if (!activeItem) return;

    if (solvedCountEl) solvedCountEl.textContent = activeItem.solved;
    if (totalCountEl) totalCountEl.textContent = `/${activeItem.total}`;
    if (solvedLabelEl) {
      solvedLabelEl.innerHTML = `<span style="color: ${activeItem.color}; font-weight: 700;">${activeItem.label}</span>`;
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
      const labelEasy = card.querySelector(".card-label-easy");
      const labelMed = card.querySelector(".card-label-medium");
      const labelHard = card.querySelector(".card-label-hard");

      let key = "";
      if (labelEasy) key = "easy";
      else if (labelMed) key = "medium";
      else if (labelHard) key = "hard";

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

    const heatmapBox = document.querySelector(".stats-card .heatmap-box");

    if (key === "hackerrank") {
      if (heatmapBox) heatmapBox.style.display = "none";
      container.innerHTML = hackerrankTemplate;
      
      // Animate the HackerRank single score circle (2840 / 4000 = 71%)
      // 71% of 211.3 visible track = 150.0
      gsap.killTweensOf("#hackerrank-score-circle");
      gsap.fromTo("#hackerrank-score-circle", 
        { "stroke-dasharray": `0 ${totalCircumference}` },
        { "stroke-dasharray": `150.0 ${totalCircumference}`, duration: 0.8, ease: "power2.out" }
      );
    } else if (key === "geeksforgeeks") {
      if (heatmapBox) heatmapBox.style.display = "none";
      container.innerHTML = geeksforgeeksTemplate;
    } else {
      if (heatmapBox) heatmapBox.style.display = "block";
      // Load LeetCode-style layout
      container.innerHTML = leetcodeTemplate;

      // Re-setup DOM references for LeetCode-style elements
      setupDOMElements();

      // Populate text values for LeetCode-style panels
      const data = platformData[key];
      if (data) {
        // 1. Summary Grid Metrics
        const statCards = container.querySelectorAll(".summary-grid .stat-card");
        data.metrics.forEach((metric, index) => {
          if (statCards[index]) {
            const valEl = statCards[index].querySelector(".stat-value");
            const lblEl = statCards[index].querySelector(".stat-label");
            if (valEl) {
              valEl.textContent = metric.value;
              valEl.className = "stat-value " + metric.class;
            }
            if (lblEl) lblEl.textContent = metric.label;
          }
        });

        // 2. Card Values
        cardItems.forEach((card) => {
          const labelEasy = card.querySelector(".card-label-easy");
          const labelMed = card.querySelector(".card-label-medium");
          const labelHard = card.querySelector(".card-label-hard");
          const valuesEl = card.querySelector(".card-values");
          
          if (!valuesEl) return;
          if (labelEasy) {
            valuesEl.innerHTML = `${data.solveRate.easy.split('/')[0]}<span>/${data.solveRate.easy.split('/')[1]}</span>`;
          } else if (labelMed) {
            valuesEl.innerHTML = `${data.solveRate.medium.split('/')[0]}<span>/${data.solveRate.medium.split('/')[1]}</span>`;
          } else if (labelHard) {
            valuesEl.innerHTML = `${data.solveRate.hard.split('/')[0]}<span>/${data.solveRate.hard.split('/')[1]}</span>`;
          }
        });

        // 3. Badges Header & Container
        const badgesContainer = container.querySelector(".badges-container");
        if (badgesContainer) {
          const panelBox = badgesContainer.closest(".panel-box");
          if (panelBox) {
            const headerEl = panelBox.querySelector(".box-header");
            if (headerEl) headerEl.textContent = data.badgesHeader;
          }
        }
        
        const badgeItems = container.querySelectorAll(".badge-item");
        data.badges.forEach((badge, index) => {
          if (badgeItems[index]) {
            const iconEl = badgeItems[index].querySelector("div[class^='badge-icon']");
            const nameEl = badgeItems[index].querySelector(".badge-name");
            const descEl = badgeItems[index].querySelector(".badge-desc");
            if (iconEl) iconEl.innerHTML = badge.icon;
            if (nameEl) nameEl.textContent = badge.name;
            if (descEl) descEl.textContent = badge.desc;
          }
        });

        // 4. Meta rows
        const metaValBlue = container.querySelector(".meta-val-blue");
        const metaValOrange = container.querySelector(".meta-val-orange");
        if (metaValBlue) metaValBlue.textContent = data.acceptance;
        if (metaValOrange) metaValOrange.textContent = data.rank;
      }

      // Re-parse, bind and initialize
      parseStatsFromCards();
      bindHoverListeners();
      showDefaultState();
    }
  }

  // Bind tab click events
  const tabs = document.querySelectorAll(".stats-card .tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Extract key (e.g. "✦ HACKERRANK" -> "hackerrank")
      const key = tab.textContent.replace("✦", "").trim().toLowerCase();
      updatePlatform(key);
    });
  });

  // Initial load execution (LeetCode default)
  setupDOMElements();
  parseStatsFromCards();
  bindHoverListeners();
  showDefaultState();
});
