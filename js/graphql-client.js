/**
 * GraphQL Client for Portfolio Coding Profiles
 * Connected to Spring Boot GraphQL Backend at http://localhost:8080/graphql
 */

const GRAPHQL_ENDPOINT = "http://localhost:8080/graphql";

// GraphQL Query for all coding profiles in deterministic visual order
const ALL_CODING_PROFILES_QUERY = `
  query GetAllCodingProfiles {
    codingProfiles {
      platform
      name
      username
      profileUrl
      avatarUrl
      problemsSolved
      rating
      globalRank
      badge
      streak
      metrics {
        label
        value
        subtext
      }
      active
    }
  }
`;

// Helper to fetch with timeout
async function fetchGraphQLWithTimeout(url, bodyData, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(bodyData),
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch all coding profiles via GraphQL and update the UI
 */
async function loadGraphQLCodingProfiles() {
  const statusBadge = document.getElementById("graphql-status");
  const statusText = document.getElementById("graphql-status-text");

  try {
    const response = await fetchGraphQLWithTimeout(GRAPHQL_ENDPOINT, {
      query: ALL_CODING_PROFILES_QUERY
    }, 2500);

    if (!response.ok) {
      console.warn(`[GraphQL] Endpoint HTTP status ${response.status}`);
      return;
    }

    const payload = await response.json();
    if (!payload || !payload.data || !Array.isArray(payload.data.codingProfiles)) {
      console.warn("[GraphQL] Invalid response shape:", payload);
      return;
    }

    const profiles = payload.data.codingProfiles;
    renderGraphQLProfiles(profiles);

    if (statusBadge) {
      statusBadge.style.display = "inline-flex";
      if (statusText) statusText.textContent = "GraphQL Live";
    }
    console.log("🚀 [GraphQL] Connected & synchronized coding profiles:", profiles);
  } catch (err) {
    console.info("[GraphQL] Backend server unreachable; using default static profiles.", err.message);
  }
}

/**
 * Update the 5 Coding Profile Cards with live GraphQL data
 */
function renderGraphQLProfiles(profiles) {
  profiles.forEach(profile => {
    const platformKey = profile.platform ? profile.platform.toLowerCase() : "";
    const card = document.querySelector(`.coding-profile-card[data-platform="${platformKey}"]`);
    if (!card) return;

    // 1. Synchronize Profile Links
    if (profile.profileUrl) {
      const extLink = card.querySelector(".card-ext-link");
      if (extLink) extLink.href = profile.profileUrl;
      const actionBtn = card.querySelector(".profile-card-action-btn");
      if (actionBtn) actionBtn.href = profile.profileUrl;
    }

    // 2. Synchronize Problems Solved
    const solvedEl = card.querySelector(".metric-block:first-child .metric-val");
    if (solvedEl && profile.problemsSolved != null) {
      solvedEl.textContent = profile.problemsSolved;
    }

    // 3. Synchronize Rating / Rank
    const ratingEl = card.querySelector(".metric-block:nth-child(2) .metric-val");
    if (ratingEl && profile.rating != null && profile.rating !== "-") {
      ratingEl.textContent = profile.rating;
    }

    // 4. Synchronize Badge, Streak & Metadata
    const metaRow = card.querySelector(".card-meta-row");
    if (metaRow) {
      const leftBold = metaRow.querySelector(".meta-item:first-child .meta-bold");
      const leftSub = metaRow.querySelector(".meta-item:first-child .meta-sub");
      if (leftBold && profile.badge && profile.badge !== "-") {
        leftBold.textContent = profile.badge;
      }
      if (leftSub && profile.globalRank && profile.globalRank !== "-") {
        leftSub.textContent = profile.globalRank;
      }

      const rightBold = metaRow.querySelector(".meta-item.text-right .meta-bold");
      if (rightBold) {
        if (profile.streak != null) {
          rightBold.textContent = profile.streak;
        } else if (profile.metrics && profile.metrics.length > 0) {
          const lastMetric = profile.metrics[profile.metrics.length - 1];
          if (lastMetric && lastMetric.value) {
            rightBold.textContent = lastMetric.value;
          }
        }
      }
    }
  });
}

/**
 * Mutation helper: Update a profile on the backend via GraphQL mutation
 */
async function updateGraphQLProfile(input) {
  const MUTATION = `
    mutation UpdateProfile($input: UpdateCodingProfileInput!) {
      updateCodingProfile(input: $input) {
        platform
        problemsSolved
        rating
        streak
        badge
        globalRank
      }
    }
  `;

  try {
    const res = await fetchGraphQLWithTimeout(GRAPHQL_ENDPOINT, {
      query: MUTATION,
      variables: { input }
    }, 3000);
    const data = await res.json();
    console.log("🚀 [GraphQL Mutation Result]:", data);
    return data;
  } catch (err) {
    console.error("[GraphQL Mutation Error]:", err);
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadGraphQLCodingProfiles);
} else {
  loadGraphQLCodingProfiles();
}
