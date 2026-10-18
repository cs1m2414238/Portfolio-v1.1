# Priyanshu Sharma — Developer Portfolio & Systems Platform

[![Portfolio CI](https://github.com/cs1m2414238/backup-web/actions/workflows/portfolio.yml/badge.svg)](https://github.com/cs1m2414238/backup-web/actions)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![GraphQL](https://img.shields.io/badge/GraphQL-Spring_GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> High-performance developer portfolio featuring an interactive 3D mechanical keyboard simulator, draggable UNIX terminal emulator, dual cyberpunk/clean theme engine, and a **Spring Boot GraphQL backend** with real-time competitive programming profile aggregation.

---

## Live Links

- **Frontend Deployment:** [priyanshu-sharma-portfolio.web.app](https://priyanshu-sharma-portfolio.web.app)
- **Flagship Project (Vidyut):** [vidyut1-1.web.app](https://vidyut1-1.web.app/)
- **Backend API (Cloud Run):** `https://portfolio-api-1026847531254.asia-south1.run.app/graphql`

---

## Architectural Overview

```
                          ┌─────────────────────────────────────┐
                          │         Client Web Browser          │
                          │   (Vanilla JS, HTML5, CSS3, GSAP)   │
                          └──────────────────┬──────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │     GitHub REST API     │                 │   Spring Boot Backend   │
          │   (Public Repos, Langs) │                 │   (Google Cloud Run)    │
          └─────────────────────────┘                 └────────────┬────────────┘
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                ▼                                     ▼
                                   ┌─────────────────────────┐           ┌─────────────────────────┐
                                   │       GraphQL API       │           │   Contact Mail Service  │
                                   │    /graphql Endpoint    │           │    (Gmail SMTP Relay)   │
                                   └────────────┬────────────┘           └─────────────────────────┘
                                                │
               ┌───────────────────┬────────────┴───────┬───────────────────┐
               ▼                   ▼                    ▼                   ▼
        ┌─────────────┐     ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
        │  LeetCode   │     │ Codeforces  │      │  CodeChef   │     │ HackerRank  │
        │ GraphQL API │     │  REST API   │      │ Scraper/API │     │  REST API   │
        └─────────────┘     └─────────────┘      └─────────────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │GeeksforGeeks│
                                         │ Flight JSON │
                                         └─────────────┘
```

---

## Key Features

### 1. Interactive 3D Mechanical Keyboard Simulation
- Customizable floating physical keyboard chassis with dynamic lighting effects.
- Realistic tactile keypress animations with customizable sound and lighting response.
- Integrated quick actions for tech stack exploration and GitHub profile navigation.

### 2. Spring Boot GraphQL Aggregator Backend
- High-concurrency data pipeline querying LeetCode, Codeforces, CodeChef, HackerRank, and GeeksforGeeks profiles simultaneously using `CompletableFuture`.
- In-memory resilient caching with automatic fallback mechanism during upstream platform maintenance.
- Robust IP-based rate limiting on sensitive mutation/dispatch endpoints.

### 3. Interactive UNIX Terminal Emulator
- Draggable and resizable floating retro terminal window with customizable viewport settings.
- Custom command parser supporting `help`, `about`, `skills`, `projects`, `stats`, `contact`, `clear`, `sudo`, and more.
- Command history navigation (Up/Down arrow support) and tab auto-completion.

### 4. Live Competitive Programming Dashboard
- Multi-platform synchronization with visual problem counters and contest ratings.
- Real-time refresh button directly connected to the GraphQL backend.
- Detailed breakdown across Easy, Medium, and Hard problem difficulties.

### 5. Dynamic GitHub Ecosystem Feed
- Real-time repository metrics fetching active language breakdown directly from the GitHub REST API.
- Live public repository count and pinned featured projects.

### 6. Dual Theme Engine
- **Obsidian Theme:** Immersive dark cyberpunk aesthetic with luminous neon green and amber accents.
- **Dawn Theme:** Clean, crisp editorial aesthetic designed for readability and professional reviews.
- Seamless transition between themes with persistent user state.

---

## Tech Stack

### Frontend
- **Languages:** HTML5, Modern CSS3 (Custom Properties, CSS Grid, Flexbox, Glassmorphism), Modern JavaScript (ES6+)
- **Animation & Typography:** GSAP (GreenSock), FontAwesome 6, Google Fonts (Syne, JetBrains Mono, Inter)
- **Deployment:** Firebase Hosting

### Backend
- **Language & Runtime:** Java 17, Spring Boot 3.5.6
- **API Framework:** Spring for GraphQL, Spring Web
- **Networking & Scraping:** RestTemplate, Jsoup HTML Parser
- **Mail & Security:** Spring Boot Mail (Gmail SMTP Relay), In-Memory Rate Limiting
- **Deployment:** Google Cloud Run (Containerized Microservice)

---

## Directory Structure

```
.
├── .github/
│   └── workflows/
│       └── portfolio.yml       # GitHub Actions CI pipeline
├── assets/                     # Project screenshots, resume, and SVGs
├── backend/                    # Spring Boot GraphQL application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/org/example/
│   │   │   │   ├── config/     # CORS & Exception handling
│   │   │   │   ├── controller/ # GraphQL & REST controllers
│   │   │   │   ├── dto/        # Request & Response payloads
│   │   │   │   ├── model/      # Data models & Enums
│   │   │   │   └── service/    # Upstream scrapers & services
│   │   │   └── resources/
│   │   │       ├── application.yaml
│   │   │       └── graphql/
│   │   │           └── schema.graphqls
│   │   └── test/               # JUnit 5 test suites (33 tests)
│   ├── pom.xml                 # Maven build definition
│   └── .gcloudignore           # Cloud Run deployment ignore rules
├── css/
│   ├── styles.css              # Core typography, hero, and theme styles
│   ├── statpannel.css          # Competitive programming dashboard layout
│   ├── non-hero-compact.css    # Responsive adjustments and skill color tokens
│   ├── terminal.css            # Retro terminal emulator styles
│   └── welcome.css             # Preloader animations
├── js/
│   ├── script.js               # Navigation, theme toggle, and GitHub API
│   ├── graphql-client.js       # GraphQL client for coding profiles
│   ├── graphql-client.test.cjs # Node test suite for frontend client (16 tests)
│   ├── heading-alignment.js    # Responsive heading alignment handler
│   ├── keyboardlighting.js     # Mechanical keyboard boot & LED sequence
│   ├── statpannel.js           # Coding dashboard tab switcher & rendering
│   ├── terminal.js             # Terminal command engine & drag/drop
│   └── welcome.js              # Welcome preloader sequence
├── firebase.json               # Firebase Hosting configuration
├── .firebaserc                 # Firebase project definition
├── .gitignore                  # Git ignore rules
├── index.html                  # Main portfolio single-page application
├── package.json                # Node configuration & test runner
└── README.md                   # Repository documentation
```

---

## Getting Started

### Prerequisites

- **Java Development Kit (JDK):** Version 17 or higher
- **Apache Maven:** Version 3.8+
- **Node.js:** Version 18+ (for running frontend unit tests)

---

### Running the Frontend Locally

Since the frontend is built with pure web standards (HTML5/CSS3/Vanilla JS), no build step is strictly required.

You can serve it with any static HTTP server:

```bash
# Using Node.js http-server or serve
npx serve .

# Or using Python 3
python -m http.server 3000
```

Open `http://localhost:3000` in your web browser.

---

### Running the Backend Locally

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Configure environment variables (optional for local testing):
   Create a `.env` or set system environment variables:
   ```env
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-google-app-password
   MAIL_RECIPIENT=your-email@gmail.com
   ```

3. Build and launch the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```

4. The GraphQL interactive endpoint will be available at:
   ```
   http://localhost:8080/graphql
   ```

---

## Running Automated Tests

### Backend Unit & Integration Tests (JUnit 5)

```bash
cd backend
mvn test
```

> 41 tests verifying LeetCode GraphQL parser, Codeforces API, CodeChef scraper, HackerRank history extractor, forwarded IP rate limiters, contact email service, and contact controller.

### Frontend Client Tests (Node.js Test Runner)

```bash
npm test
```

> 16 tests covering profile parsing, cache invalidation, offline fallbacks, and DOM synchronization.

---

## GraphQL API Reference

### Query: `getAllCodingProfiles`

Fetches synchronized competitive programming metrics for all 5 platforms.

```graphql
query GetAllCodingProfiles {
  codingProfiles {
    platform
    name
    username
    profileUrl
    problemsSolved
    rating
    globalRank
    badge
    streak
    active
    metrics {
      label
      value
      subtext
    }
  }
}
```

#### Sample Response:

```json
{
  "data": {
    "codingProfiles": [
      {
        "platform": "LEETCODE",
        "name": "LeetCode",
        "username": "9sY5neJGk8",
        "problemsSolved": 354,
        "rating": "-",
        "globalRank": "-",
        "active": true
      },
      {
        "platform": "CODEFORCES",
        "name": "Codeforces",
        "username": "Unexpectedpriyanshu",
        "problemsSolved": 4,
        "rating": "562",
        "globalRank": "Newbie",
        "active": false
      }
    ]
  }
}
```

---

## Deployment Guide

### Deploying Frontend to Firebase Hosting

```bash
# Login to Firebase
firebase login

# Deploy root static files
firebase deploy --only hosting
```

### Deploying Backend to Google Cloud Run

```bash
cd backend
gcloud run deploy portfolio-api \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars MAIL_USERNAME="your-email@gmail.com",MAIL_PASSWORD="your-google-app-password",MAIL_RECIPIENT="your-email@gmail.com"
```

Or configure environment variables on an existing service:

```bash
gcloud run services update portfolio-api \
  --region asia-south1 \
  --update-env-vars MAIL_USERNAME="your-email@gmail.com",MAIL_PASSWORD="your-google-app-password",MAIL_RECIPIENT="your-email@gmail.com"
```

---

## Author & Contact

**Priyanshu Sharma**  
*Computer Science & Engineering, PSIT Kanpur (Class of 2028)*

- **GitHub:** [@cs1m2414238](https://github.com/cs1m2414238)
- **LinkedIn:** [linkedin.com/in/priyanshu](https://linkedin.com/in/priyanshu)
- **YouTube:** [@PriyanshuSharma-l7r](https://www.youtube.com/@PriyanshuSharma-l7r)
- **Dev.to:** [dev.to/priyanshu_sharma_a2be186a](https://dev.to/priyanshu_sharma_a2be186a)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
