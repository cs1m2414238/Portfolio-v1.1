const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { createContext, runInContext } = require("node:vm");

const source = readFileSync(join(__dirname, "graphql-client.js"), "utf8");

const cacheKey = "portfolio:coding-profiles:v4";

function platformCard() {
  const nodes = {
    solved: {}, rating: {}, ratingLabel: {}, left: {}, leftLabel: {}, right: {}, rightLabel: {}, externalLink: {}, actionLink: {}
  };
  const meta = { querySelector(selector) {
    return {
      ".meta-item:first-child .meta-bold": nodes.left,
      ".meta-item:first-child .meta-sub": nodes.leftLabel,
      ".meta-item.text-right .meta-bold": nodes.right,
      ".meta-item.text-right .meta-sub": nodes.rightLabel
    }[selector] ?? null;
  } };
  return { nodes, querySelector(selector) {
    return {
      ".metric-block:first-child .metric-val": nodes.solved,
      ".metric-block:nth-child(2) .metric-val": nodes.rating,
      ".metric-block:nth-child(2) .metric-lbl": nodes.ratingLabel,
      ".card-meta-row": meta,
      ".card-ext-link": nodes.externalLink,
      ".profile-card-action-btn": nodes.actionLink
    }[selector] ?? null;
  } };
}

function createClient(fetch, savedCache) {
  const solved = { textContent: "354" };
  const status = {};
  const refreshLabel = { textContent: "Refresh" };
  const listeners = {};
  const button = {
    disabled: false,
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelector() { return refreshLabel; },
    addEventListener(event, handler) { listeners[event] = handler; }
  };
  const storage = new Map();
  if (savedCache !== undefined) storage.set(cacheKey, savedCache);
  const card = {
    querySelector(selector) {
      return selector === ".metric-block:first-child .metric-val" ? solved : null;
    }
  };
  const timers = new Map();
  let timerId = 0;
  const context = createContext({
    fetch,
    AbortController,
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); }
    },
    console: { log() {}, warn() {} },
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, delay });
      return timerId;
    },
    clearTimeout(id) { timers.delete(id); },
    document: {
      readyState: "loading",
      addEventListener() {},
      getElementById(id) {
        return id === "coding-profiles-refresh" ? button : id === "coding-profiles-refresh-status" ? status : null;
      },
      querySelector(selector) {
        return selector === '.coding-profile-card[data-platform="leetcode"]' ? card : null;
      }
    }
  });
  runInContext(source, context);
  return { context, solved, button, refreshLabel, listeners, status, timers, storage };
}

test("renders the live solved count and disables response caching", async () => {
  let options;
  const client = createClient(async (url, requestOptions) => {
    options = requestOptions;
    return { ok: true, json: async () => ({ data: {
      codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }]
    } }) };
  });

  await runInContext("loadGraphQLCodingProfiles()", client.context);

  assert.equal(Number(client.solved.textContent), 356);
  assert.equal(options.cache, "no-store");
  assert.match(client.status.textContent, /^Profiles updated/);
  assert.equal(JSON.parse(client.storage.get(cacheKey)).profiles[0].problemsSolved, 356);
  assert.equal(client.button.disabled, false);
});

test("renders the provided CodeChef and HackerRank profiles with platform-specific metrics", async () => {
  const codeChef = platformCard();
  const hackerRank = platformCard();
  const client = createClient(async () => ({ ok: true, json: async () => ({ data: { codingProfiles: [
    { platform: "CODECHEF", profileUrl: "https://www.codechef.com/users/unexpected628", problemsSolved: 78,
      rating: "Unrated", badge: "Unrated", globalRank: "-", metrics: [{ label: "Global Rank", value: "-" }] },
    { platform: "HACKERRANK", profileUrl: "https://www.hackerrank.com/profile/cs1m_2414238", problemsSolved: 82,
      rating: "4\u2605", badge: "6", globalRank: "-", metrics: [{ label: "Score", value: "1138.44" }] }
  ] } }) }));
  client.context.document.querySelector = selector => ({
    '.coding-profile-card[data-platform="codechef"]': codeChef,
    '.coding-profile-card[data-platform="hackerrank"]': hackerRank
  }[selector] ?? null);

  await runInContext("loadGraphQLCodingProfiles()", client.context);

  assert.equal(codeChef.nodes.solved.textContent, 78);
  assert.equal(codeChef.nodes.rating.textContent, "Unrated");
  assert.equal(codeChef.nodes.leftLabel.textContent, "Contest Status");
  assert.equal(codeChef.nodes.externalLink.href, "https://www.codechef.com/users/unexpected628");
  assert.equal(hackerRank.nodes.solved.textContent, 82);
  assert.equal(hackerRank.nodes.ratingLabel.textContent, "Top Badge");
  assert.equal(hackerRank.nodes.rating.textContent, "4\u2605");
  assert.equal(hackerRank.nodes.left.textContent, "6");
  assert.equal(hackerRank.nodes.leftLabel.textContent, "Badges");
  assert.equal(hackerRank.nodes.right.textContent, "1138.44");
  assert.equal(hackerRank.nodes.rightLabel.textContent, "Practice Score");
  assert.equal(hackerRank.nodes.actionLink.href, "https://www.hackerrank.com/profile/cs1m_2414238");
});

test("cached HackerRank profiles show Practice Score without refetching or changing the value", async () => {
  const hackerRank = platformCard();
  const cached = JSON.stringify({ updatedAt: Date.now(), profiles: [
    { platform: "HACKERRANK", problemsSolved: 82, rating: "4\u2605", badge: "6",
      metrics: [{ label: "Score", value: "1138.44" }] }
  ] });
  let requests = 0;
  const client = createClient(() => {
    requests++;
    throw new Error("Cached profiles should not trigger a fetch");
  }, cached);
  client.context.document.querySelector = selector =>
    selector === '.coding-profile-card[data-platform="hackerrank"]' ? hackerRank : null;

  await runInContext("initializeCodingProfiles()", client.context);

  assert.equal(hackerRank.nodes.right.textContent, "1138.44");
  assert.equal(hackerRank.nodes.rightLabel.textContent, "Practice Score");
  assert.equal(hackerRank.nodes.solved.textContent, 82);
  assert.equal(requests, 0);
});

test("CodeChef global rank stays in the rank slot rather than replacing the division label", () => {
  const codeChef = platformCard();
  const client = createClient(async () => {});
  client.context.document.querySelector = () => codeChef;
  runInContext(`renderGraphQLProfiles([{platform:"CODECHEF",problemsSolved:80,rating:"1450",badge:"Div 3",globalRank:"12345",metrics:[{label:"Global Rank",value:"12345"}]}])`, client.context);
  assert.equal(codeChef.nodes.left.textContent, "Div 3");
  assert.equal(codeChef.nodes.leftLabel.textContent, "Division");
  assert.equal(codeChef.nodes.right.textContent, "12345");
});

test("GFG renders its current POTD streak separately from score and preserves both links", () => {
  const gfg = platformCard();
  const client = createClient(async () => {});
  client.context.document.querySelector = () => gfg;
  runInContext(`renderGraphQLProfiles([{platform:"GEEKSFORGEEKS",profileUrl:"https://www.geeksforgeeks.org/profile/2k24cs1mvgrc",problemsSolved:12,rating:"38",streak:0,globalRank:"Institute Rank 516",metrics:[{label:"Coding Score",value:"38"},{label:"Institute Rank",value:"516"},{label:"POTD Streak",value:"0"}]}])`, client.context);
  assert.equal(gfg.nodes.solved.textContent, 12);
  assert.equal(gfg.nodes.rating.textContent, "38");
  assert.equal(gfg.nodes.ratingLabel.textContent, "Coding Score");
  assert.equal(gfg.nodes.left.textContent, "0 Days");
  assert.equal(gfg.nodes.leftLabel.textContent, "POTD Streak");
  assert.equal(gfg.nodes.right.textContent, "516");
  assert.equal(gfg.nodes.rightLabel.textContent, "Institute Rank");
  assert.equal(gfg.nodes.externalLink.href, "https://www.geeksforgeeks.org/profile/2k24cs1mvgrc?tab=activity");
  assert.equal(gfg.nodes.actionLink.href, "https://www.geeksforgeeks.org/profile/2k24cs1mvgrc");
});

test("old-account snapshots are ignored once when upgrading the cache", async () => {
  let requests = 0;
  const client = createClient(async () => {
    requests++;
    return { ok: true, json: async () => ({ data: { codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }] } }) };
  });
  client.storage.set("portfolio:coding-profiles:v3", JSON.stringify({ profiles: [{ platform: "GEEKSFORGEEKS", username: "2k24cs1mvgrc", rating: "Rank 516", problemsSolved: 12 }] }));
  await runInContext("initializeCodingProfiles()", client.context);
  assert.equal(requests, 1);
  assert.equal(Number(client.solved.textContent), 356);
  assert.ok(client.storage.has(cacheKey));
});

test("LeetCode uses the real contest count without inventing a Knight badge or 41-day streak", () => {
  const leetcode = platformCard();
  const client = createClient(async () => {});
  client.context.document.querySelector = () => leetcode;
  runInContext(`renderGraphQLProfiles([{platform:"LEETCODE",rating:"1,481",badge:null,globalRank:"Top 50.84%",streak:97,metrics:[{label:"Contests",value:"14"}]}])`, client.context);
  assert.equal(leetcode.nodes.rating.textContent, "1,481");
  assert.equal(leetcode.nodes.left.textContent, "14 Contests");
  assert.equal(leetcode.nodes.leftLabel.textContent, "Top 50.84%");
  assert.equal(leetcode.nodes.right.textContent, 97);
  assert.equal(leetcode.nodes.rightLabel.textContent, "Max Streak");
});

test("LeetCode still displays a genuinely awarded badge", () => {
  const leetcode = platformCard();
  const client = createClient(async () => {});
  client.context.document.querySelector = () => leetcode;
  runInContext(`renderGraphQLProfiles([{platform:"LEETCODE",rating:"1,901",badge:"Knight",globalRank:"Top 20%",streak:null,metrics:[]}])`, client.context);
  assert.equal(leetcode.nodes.left.textContent, "Knight");
  assert.equal(leetcode.nodes.right.textContent, "-");
});

test("an unavailable backend preserves the shown count and enables retry", async () => {
  const client = createClient(async () => { throw new Error("Connection refused"); });
  client.solved.textContent = "356";

  await runInContext("loadGraphQLCodingProfiles()", client.context);

  assert.equal(client.solved.textContent, "356");
  assert.match(client.status.textContent, /Couldn't refresh/);
  assert.equal(client.button.disabled, false);
});

test("GraphQL errors do not overwrite the saved snapshot", async () => {
  const savedCache = JSON.stringify({ profiles: [{ platform: "LEETCODE", problemsSolved: 356 }] });
  const client = createClient(async () => ({
    ok: true,
    json: async () => ({ errors: [{ message: "Upstream failed" }] })
  }), savedCache);

  await runInContext("loadGraphQLCodingProfiles()", client.context);

  assert.equal(client.solved.textContent, "354");
  assert.match(client.status.textContent, /Couldn't refresh/);
  assert.equal(client.storage.get(cacheKey), savedCache);
});

test("the longer timeout remains active while the response body is loading", async () => {
  let finishBody;
  let beginBody;
  const bodyStarted = new Promise(resolve => { beginBody = resolve; });
  const client = createClient(async () => ({
    ok: true,
    json: () => new Promise(resolve => {
      finishBody = resolve;
      beginBody();
    })
  }));
  const pending = runInContext("loadGraphQLCodingProfiles()", client.context);
  await bodyStarted;

  assert.equal(client.timers.size, 1);
  assert.equal([...client.timers.values()][0].delay, 30000);
  assert.equal(client.button.disabled, true);
  assert.equal(client.button.attributes["aria-busy"], "true");
  finishBody({ data: { codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }] } });
  await pending;
  assert.equal(client.timers.size, 0);
  assert.equal(Number(client.solved.textContent), 356);
  assert.equal(client.button.attributes["aria-busy"], "false");
});

test("first visit fetches profiles and later visits restore them without a request", async () => {
  let requests = 0;
  const firstVisit = createClient(async () => {
    requests++;
    return { ok: true, json: async () => ({ data: {
      codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }]
    } }) };
  });
  await runInContext("initializeCodingProfiles()", firstVisit.context);

  const nextVisit = createClient(async () => { requests++; throw new Error("Unexpected request"); }, firstVisit.storage.get(cacheKey));
  await runInContext("initializeCodingProfiles()", nextVisit.context);

  assert.equal(requests, 1);
  assert.equal(Number(nextVisit.solved.textContent), 356);
  assert.match(nextVisit.status.textContent, /Saved profiles loaded/);
});

test("the Refresh button replaces cached profiles with the latest response", async () => {
  const savedCache = JSON.stringify({ profiles: [{ platform: "LEETCODE", problemsSolved: 356 }] });
  let requests = 0;
  const client = createClient(async () => {
    requests++;
    return { ok: true, json: async () => ({ data: {
      codingProfiles: [{ platform: "LEETCODE", problemsSolved: 357 }]
    } }) };
  }, savedCache);
  await runInContext("initializeCodingProfiles()", client.context);
  assert.equal(requests, 0);

  await client.listeners.click();

  assert.equal(requests, 1);
  assert.equal(Number(client.solved.textContent), 357);
  assert.equal(JSON.parse(client.storage.get(cacheKey)).profiles[0].problemsSolved, 357);
});

test("a corrupt cache is ignored and replaced by a valid response", async () => {
  const client = createClient(async () => ({ ok: true, json: async () => ({ data: {
    codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }]
  } }) }), "{invalid");

  await runInContext("initializeCodingProfiles()", client.context);

  assert.equal(Number(client.solved.textContent), 356);
  assert.equal(JSON.parse(client.storage.get(cacheKey)).profiles[0].problemsSolved, 356);
});

test("blocked browser storage does not stop profiles from loading", async () => {
  const client = createClient(async () => ({ ok: true, json: async () => ({ data: {
    codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }]
  } }) }));
  client.context.localStorage = {
    getItem() { throw new Error("Storage blocked"); },
    setItem() { throw new Error("Storage blocked"); }
  };

  await runInContext("initializeCodingProfiles()", client.context);

  assert.equal(Number(client.solved.textContent), 356);
  assert.match(client.status.textContent, /^Profiles updated/);
});

test("repeated refresh calls share one in-flight request", async () => {
  let finishRequest;
  let requests = 0;
  const client = createClient(() => {
    requests++;
    return new Promise(resolve => { finishRequest = resolve; });
  });
  const firstRequest = runInContext("loadGraphQLCodingProfiles()", client.context);
  await runInContext("loadGraphQLCodingProfiles()", client.context);
  assert.equal(requests, 1);
  finishRequest({ ok: true, json: async () => ({ data: {
    codingProfiles: [{ platform: "LEETCODE", problemsSolved: 356 }]
  } }) });
  await firstRequest;
  assert.equal(Number(client.solved.textContent), 356);
});
