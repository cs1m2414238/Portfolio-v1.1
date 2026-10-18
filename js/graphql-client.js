/**
 * GraphQL Client for Portfolio Coding Profiles
 * Connected to Spring Boot GraphQL Backend on Cloud Run
 */

const GRAPHQL_ENDPOINT =
  "https://portfolio-api-1026847531254.asia-south1.run.app/graphql";
// Platform fetches run concurrently; HackerRank also pages through completed challenges.
const CODING_PROFILES_TIMEOUT_MS = 30000;
// Invalidate snapshots with the former rating/rank mapping and hard-coded LeetCode badge.
const CODING_PROFILES_CACHE_KEY = "portfolio:coding-profiles:v4";
let codingProfilesRequestInFlight = false;

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
async function fetchGraphQLWithTimeout(url, bodyData, timeoutMs = CODING_PROFILES_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify(bodyData),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Endpoint returned HTTP ${response.status}`);
    }

    // Keep the timeout active until the response body has also been read.
    const payload = await response.json();
    if (payload?.errors?.length) {
      throw new Error(payload.errors.map(error => error.message).join("; "));
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch fresh profiles on first visit or when the Refresh button is pressed.
 */
async function loadGraphQLCodingProfiles() {
  if (codingProfilesRequestInFlight) return;
  codingProfilesRequestInFlight = true;
  const refreshButton = document.getElementById("coding-profiles-refresh");
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.setAttribute("aria-busy", "true");
  }

  try {
    const payload = await fetchGraphQLWithTimeout(GRAPHQL_ENDPOINT, {
      query: ALL_CODING_PROFILES_QUERY
    });

    if (!validCodingProfiles(payload?.data?.codingProfiles)) {
      throw new Error("Invalid coding profiles response");
    }

    const profiles = payload.data.codingProfiles;
    renderGraphQLProfiles(profiles);
    const updatedAt = Date.now();
    try {
      localStorage.setItem(CODING_PROFILES_CACHE_KEY, JSON.stringify({ profiles, updatedAt }));
    } catch (err) {
      console.warn("[Profiles] Browser storage unavailable; profiles updated for this visit.", err.message);
    }
    announceCodingProfiles(`Profiles updated ${new Date(updatedAt).toLocaleString()}.`);
  } catch (err) {
    announceCodingProfiles("Couldn't refresh profiles. Previously shown values are kept. Try refreshing again.");
    console.warn("[GraphQL] Profile refresh failed; keeping previously shown values.", err.message);
  } finally {
    codingProfilesRequestInFlight = false;
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.setAttribute("aria-busy", "false");
    }
  }
}

function validCodingProfiles(profiles) {
  const platforms = ["LEETCODE", "GEEKSFORGEEKS", "CODEFORCES", "CODECHEF", "HACKERRANK"];
  return Array.isArray(profiles) && profiles.length > 0 && profiles.every(profile =>
    profile && platforms.includes(profile.platform)
      && (profile.problemsSolved == null || (Number.isInteger(profile.problemsSolved) && profile.problemsSolved >= 0))
  );
}

function announceCodingProfiles(message) {
  const announcement = document.getElementById("coding-profiles-refresh-status");
  const refreshButton = document.getElementById("coding-profiles-refresh");
  if (announcement) announcement.textContent = message;
  if (refreshButton) refreshButton.title = message;
}

async function initializeCodingProfiles() {
  const refreshButton = document.getElementById("coding-profiles-refresh");
  refreshButton?.addEventListener("click", () => {
    if (!codingProfilesRequestInFlight && !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      refreshButton.animate?.([
        { transform: "rotate(0deg)" },
        { transform: "rotate(360deg)" }
      ], { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
    }
    return loadGraphQLCodingProfiles();
  });

  // A saved profile survives reloads. Only Refresh requests a new snapshot.
  try {
    const cached = JSON.parse(localStorage.getItem(CODING_PROFILES_CACHE_KEY));
    if (validCodingProfiles(cached?.profiles)) {
      renderGraphQLProfiles(cached.profiles);
      const savedAt = Number.isFinite(cached.updatedAt) ? ` Last updated ${new Date(cached.updatedAt).toLocaleString()}.` : "";
      announceCodingProfiles(`Saved profiles loaded.${savedAt} Refresh to update.`);
      return;
    }
  } catch (err) {
    console.warn("[Profiles] Saved profiles unavailable; fetching fresh profiles.", err.message);
  }

  await loadGraphQLCodingProfiles();
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
      if (extLink) extLink.href = platformKey === "geeksforgeeks"
        ? `${profile.profileUrl.split("?")[0]}?tab=activity` : profile.profileUrl;
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
    if (platformKey === "hackerrank") {
      const ratingLabel = card.querySelector(".metric-block:nth-child(2) .metric-lbl");
      if (ratingLabel) ratingLabel.textContent = "Top Badge";
    }
    if (platformKey === "geeksforgeeks") {
      const ratingLabel = card.querySelector(".metric-block:nth-child(2) .metric-lbl");
      if (ratingLabel) ratingLabel.textContent = "Coding Score";
    }

    // 4. Synchronize Badge, Streak & Metadata
    const metaRow = card.querySelector(".card-meta-row");
    if (metaRow) {
      const leftBold = metaRow.querySelector(".meta-item:first-child .meta-bold");
      const leftSub = metaRow.querySelector(".meta-item:first-child .meta-sub");
      if (platformKey === "leetcode") {
        const contests = profile.metrics?.find(metric => metric.label === "Contests")?.value;
        const hasBadge = profile.badge && profile.badge !== "-";
        if (leftBold) leftBold.textContent = hasBadge ? profile.badge
          : contests != null ? `${contests} ${String(contests) === "1" ? "Contest" : "Contests"}` : "-";
        if (leftSub) leftSub.textContent = profile.globalRank || "-";
        const rightBold = metaRow.querySelector(".meta-item.text-right .meta-bold");
        const rightSub = metaRow.querySelector(".meta-item.text-right .meta-sub");
        if (rightBold) rightBold.textContent = profile.streak ?? "-";
        if (rightSub) rightSub.textContent = "Max Streak";
        return;
      }
      if (platformKey === "geeksforgeeks") {
        if (leftBold && profile.streak != null) leftBold.textContent = `${profile.streak} ${profile.streak === 1 ? "Day" : "Days"}`;
        if (leftSub) leftSub.textContent = "POTD Streak";
        const rank = profile.metrics?.find(metric => metric.label === "Institute Rank")?.value;
        const rightBold = metaRow.querySelector(".meta-item.text-right .meta-bold");
        const rightSub = metaRow.querySelector(".meta-item.text-right .meta-sub");
        if (rightBold && rank != null) rightBold.textContent = rank;
        if (rightSub) rightSub.textContent = "Institute Rank";
        return;
      }
      if (platformKey === "codechef" || platformKey === "hackerrank") {
        if (leftBold && profile.badge && profile.badge !== "-") leftBold.textContent = profile.badge;
        if (leftSub) leftSub.textContent = platformKey === "hackerrank" ? "Badges"
          : profile.badge === "Unrated" ? "Contest Status" : "Division";
        const metricName = platformKey === "codechef" ? "Global Rank" : "Score";
        const value = profile.metrics?.find(metric => metric.label === metricName)?.value;
        const rightBold = metaRow.querySelector(".meta-item.text-right .meta-bold");
        const rightSub = metaRow.querySelector(".meta-item.text-right .meta-sub");
        if (rightBold && value != null && value !== "-") rightBold.textContent = value;
        if (rightSub) rightSub.textContent = platformKey === "hackerrank" ? "Practice Score" : "Global Rank";
        return;
      }
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
    const data = await fetchGraphQLWithTimeout(GRAPHQL_ENDPOINT, {
      query: MUTATION,
      variables: { input }
    }, 3000);
    console.log("🚀 [GraphQL Mutation Result]:", data);
    return data;
  } catch (err) {
    console.error("[GraphQL Mutation Error]:", err);
  }
}

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCodingProfiles);
} else {
  initializeCodingProfiles();
}
