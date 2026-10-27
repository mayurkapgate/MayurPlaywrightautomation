# Playwright Test Sharding — Complete Guide

**Naveen Automation Labs | G1 Batch**

---

## 1. What is Sharding?

Sharding splits your test suite across multiple machines/containers. Each machine runs a portion of tests in parallel — reducing total execution time.

```
Without Sharding:
  1 machine → 52 tests → ~5 min

With 4 Shards:
  Machine 1 → 13 tests → ~1.2 min  ─┐
  Machine 2 → 13 tests → ~1.2 min   ├─ All run PARALLEL
  Machine 3 → 13 tests → ~1.2 min   │
  Machine 4 → 13 tests → ~1.2 min  ─┘

Total time: ~1.2 min (4x faster)
```

---

## 2. Sharding vs Parallel Workers

These are two different things — use both together for max speed.

| Feature | Parallel Workers | Sharding |
|---|---|---|
| What | Multiple workers on ONE machine | Split tests across MULTIPLE machines |
| Config | `fullyParallel: true` in config | `--shard=1/4` in CLI |
| Scale | Limited by CPU cores | Unlimited — add more machines |
| Use together? | Yes — each shard can have multiple workers | |

```
Best combo: 4 shards × 2 workers each = 8 parallel test runners
```

---

## 3. Shard Command Format

```
--shard=<which shard>/<total shards>
```

```bash
--shard=1/4   →  1st shard out of 4  →  tests 1-13
--shard=2/4   →  2nd shard out of 4  →  tests 14-26
--shard=3/4   →  3rd shard out of 4  →  tests 27-39
--shard=4/4   →  4th shard out of 4  →  tests 40-52
```

Playwright automatically distributes tests evenly. You don't choose which test goes where.

**Odd numbers:**

```
99 tests / 4 shards = 25 + 25 + 25 + 24
Remainder tests go to starting shards.
```

---

## 4. Basic CLI Usage

### List tests per shard (without running)

```bash
npx playwright test --shard=1/4 --list
npx playwright test --shard=2/4 --list
```

### Run shards locally

```bash
# Terminal 1
npx playwright test --project=chromium --shard=1/4

# Terminal 2 (new terminal)
npx playwright test --project=chromium --shard=2/4

# Terminal 3
npx playwright test --project=chromium --shard=3/4

# Terminal 4
npx playwright test --project=chromium --shard=4/4
```

---

## 5. Blob Reporter (Required for Merging)

To merge shard reports into a single report, you need the `blob` reporter.

### playwright.config.ts

```typescript
reporter: process.env.CI
    ? [
        ["blob"],
        ["html", { outputFolder: "reports/html-report", open: "never" }],
        ["allure-playwright", { outputFolder: "allure-results", suiteTitle: true }],
        ["reporting-labs", { open: "never" }],
      ]
    : [
        ["blob", { outputDir: "blob-report" }],
        ["list"],
        ["html", { outputFolder: "reports/html-report", open: "never" }],
        ["allure-playwright", { outputFolder: "allure-results", suiteTitle: true }],
        ["reporting-labs", { open: "never" }],
      ],
```

- **Local:** `blob` + `list` + HTML + Allure + reportingLabs
- **CI:** `blob` + HTML + Allure + reportingLabs (no `list` needed)

`blob` generates internal data files that Playwright uses to merge shard results into one report.

<div class="rl">

**reportingLabs does not need `blob`.** Install it once with `npm i -D reporting-labs@latest` (0.6.14 or newer). Every shard writes its own `reporting-labs/` folder: `index.html`, `report.pdf` and a small `report.json`. `npx reporting-labs merge` reads the `report.json` files and builds **one** HTML report for all shards. Shards that run at the same time in one folder (Jenkins, section 9) each get their own folder with `REPORTING_LABS_OUTPUT_FOLDER`; no config change is needed.

</div>

---

## 6. Local Sharding with Report Merging

### Step 1: Run each shard

```bash
# Clean previous reports
rm -rf blob-report blob-shard-* reports allure-results allure-shard-*
rm -rf reporting-labs rl-shard-* reporting-labs-merged          # reportingLabs

# Shard 1
npx playwright test --project=chromium --shard=1/4
mv blob-report blob-shard-1
mv reports/html-report reports-shard-1
mv allure-results allure-shard-1
mv reporting-labs rl-shard-1                                     # reportingLabs

# Shard 2
npx playwright test --project=chromium --shard=2/4
mv blob-report blob-shard-2
mv reports/html-report reports-shard-2
mv allure-results allure-shard-2
mv reporting-labs rl-shard-2                                     # reportingLabs

# Shard 3
npx playwright test --project=chromium --shard=3/4
mv blob-report blob-shard-3
mv reports/html-report reports-shard-3
mv allure-results allure-shard-3
mv reporting-labs rl-shard-3                                     # reportingLabs

# Shard 4
npx playwright test --project=chromium --shard=4/4
mv blob-report blob-shard-4
mv reports/html-report reports-shard-4
mv allure-results allure-shard-4
mv reporting-labs rl-shard-4                                     # reportingLabs
```

### Step 2: Merge PW HTML report

```bash
mkdir -p all-blob-reports
cp blob-shard-1/* all-blob-reports/
cp blob-shard-2/* all-blob-reports/
cp blob-shard-3/* all-blob-reports/
cp blob-shard-4/* all-blob-reports/

npx playwright merge-reports --reporter=html ./all-blob-reports
npx playwright show-report playwright-report
```

### Step 3: Merge Allure report

```bash
mkdir -p all-allure-results
cp allure-shard-1/* all-allure-results/
cp allure-shard-2/* all-allure-results/
cp allure-shard-3/* all-allure-results/
cp allure-shard-4/* all-allure-results/

npx allure generate all-allure-results --clean -o merged-allure-report
npx allure open merged-allure-report
```

### Step 4: Merge reportingLabs report

```bash
npx reporting-labs merge rl-shard-1 rl-shard-2 rl-shard-3 rl-shard-4 -o reporting-labs-merged
open reporting-labs-merged/index.html        
# Windows: start reporting-labs-merged\index.html
```

No copying needed: `merge` reads each shard folder directly. It prints `merged: 52 tests · ... passed · ... failed`.

What the merged report shows:

- **Timeline:** every shard's workers get their own rows (`S1·w0`, `S1·w1` … `S4·w3`). Shards run one after another (like here) form a staircase; shards run in parallel (Docker, CI) line up.
- **Workers:** `4 shards × 2 workers = 8 workers`, how busy they were, and the wall clock from the first shard's start to the last shard's end.
- **Environment:** a **Shards** row, and **Workers** as `2 per shard · 8 in total`.
- **PDF:** each `rl-shard-N/` has its own `report.pdf`; for a PDF of the merged report, click **Export PDF** in the merged HTML.

### Result

| Report | Tests |
|---|---|
| reports-shard-1/ | ~13 tests |
| reports-shard-2/ | ~13 tests |
| reports-shard-3/ | ~13 tests |
| reports-shard-4/ | ~13 tests |
| playwright-report/ (merged) | 52 tests |
| merged-allure-report/ (merged) | 52 tests |
| rl-shard-1/ … rl-shard-4/ (HTML + PDF each) | ~13 tests each |
| reporting-labs-merged/ (merged) | 52 tests |

---

## 7. Docker Sharding (Parallel Containers)

### docker-compose.shard.yml

```yaml
version: '3.8'

services:
  shard1:
    build: .
    env_file:
      - config/.env.qa
    environment:
      - CI=true
    volumes:
      - ./reports-shard1:/app/reports/html-report
      - ./allure-shard1:/app/allure-results
      - ./blob-shard1:/app/blob-report
      - ./rl-shard1:/app/reporting-labs          # reportingLabs
    command: npx playwright test --project=chromium --shard=1/4

  shard2:
    build: .
    env_file:
      - config/.env.qa
    environment:
      - CI=true
    volumes:
      - ./reports-shard2:/app/reports/html-report
      - ./allure-shard2:/app/allure-results
      - ./blob-shard2:/app/blob-report
      - ./rl-shard2:/app/reporting-labs          # reportingLabs
    command: npx playwright test --project=chromium --shard=2/4

  shard3:
    build: .
    env_file:
      - config/.env.qa
    environment:
      - CI=true
    volumes:
      - ./reports-shard3:/app/reports/html-report
      - ./allure-shard3:/app/allure-results
      - ./blob-shard3:/app/blob-report
      - ./rl-shard3:/app/reporting-labs          # reportingLabs
    command: npx playwright test --project=chromium --shard=3/4

  shard4:
    build: .
    env_file:
      - config/.env.qa
    environment:
      - CI=true
    volumes:
      - ./reports-shard4:/app/reports/html-report
      - ./allure-shard4:/app/allure-results
      - ./blob-shard4:/app/blob-report
      - ./rl-shard4:/app/reporting-labs          # reportingLabs
    command: npx playwright test --project=chromium --shard=4/4
```

### Run

```bash
docker-compose -f docker-compose.shard.yml up --build
```

All 4 containers start simultaneously — true parallel execution.

### Merge reportingLabs report (after the containers finish)

```bash
npx reporting-labs merge rl-shard1 rl-shard2 rl-shard3 rl-shard4 -o reporting-labs-merged
open reporting-labs-merged/index.html
```

Runs on your machine, outside Docker. Each `rl-shardN/` folder already has that container's `index.html` and `report.pdf`.

### Docker vs Local Sharding

```
Local:
  Terminal 1: shard 1 → done
  Terminal 2: shard 2 → done      (manually, one by one)
  Terminal 3: shard 3 → done
  Terminal 4: shard 4 → done

Docker Compose:
  Container 1: shard 1 ─┐
  Container 2: shard 2  ├─ ALL PARALLEL, one command
  Container 3: shard 3  │
  Container 4: shard 4 ─┘
```

### Memory Tip

4 Chromium containers are heavy. Set Docker Desktop → Settings → Resources → Memory: 4GB+. Use `workers: 1` in playwright.config.ts for Docker to avoid crashes.

---

## 8. GitHub Actions Sharding (Matrix Strategy)

```yaml
name: Sharded Playwright Tests

on:
  workflow_dispatch:

jobs:
  test:
    name: Shard ${{ matrix.shard }}/4
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    environment: QA

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Run shard ${{ matrix.shard }}/4
        run: npx playwright test --project=chromium --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          USERNAME: ${{ secrets.USERNAME }}
          PASSWORD: ${{ secrets.PASSWORD }}
          API_TOKEN: ${{ secrets.API_TOKEN }}

      - name: Upload blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-shard-${{ matrix.shard }}
          path: blob-report/

      - name: Upload allure results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-results-shard-${{ matrix.shard }}
          path: allure-results/

      - name: Upload reportingLabs shard report      # reportingLabs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: reporting-labs-shard-${{ matrix.shard }}
          path: reporting-labs/

  merge-reports:
    name: Merge Reports
    needs: test
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npm install -g allure-commandline

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge PW HTML report
        run: npx playwright merge-reports --reporter=html ./all-blob-reports

      - name: Download allure results
        uses: actions/download-artifact@v4
        with:
          path: all-allure-results
          pattern: allure-results-shard-*

      - name: Merge Allure report
        run: |
          mkdir -p combined-allure
          for dir in all-allure-results/allure-results-shard-*/; do
            cp -r "$dir"* combined-allure/ 2>/dev/null || true
          done
          allure generate combined-allure --clean -o merged-allure-report

      - name: Download reportingLabs shard reports    # reportingLabs
        uses: actions/download-artifact@v4
        with:
          path: all-rl-shards
          pattern: reporting-labs-shard-*

      - name: Merge reportingLabs report              # reportingLabs
        run: npx reporting-labs merge all-rl-shards -o reporting-labs-merged

      - name: Upload merged PW HTML report
        uses: actions/upload-artifact@v4
        with:
          name: merged-pw-html-report
          path: playwright-report/

      - name: Upload merged Allure report
        uses: actions/upload-artifact@v4
        with:
          name: merged-allure-report
          path: merged-allure-report/

      - name: Upload merged reportingLabs report      # reportingLabs
        uses: actions/upload-artifact@v4
        with:
          name: merged-reporting-labs-report
          path: reporting-labs-merged/
```

### Key Concepts

- `matrix.shard: [1, 2, 3, 4]` — GitHub creates 4 parallel jobs on 4 separate VMs
- `fail-fast: false` — if shard 1 fails, shard 2/3/4 still run
- `merge-reports` job — waits for all shards, combines into single report
- **reportingLabs:** do **not** set `merge-multiple: true` for its download. Each shard lands in its own folder (`all-rl-shards/reporting-labs-shard-1/` …) and `npx reporting-labs merge all-rl-shards` picks up every subfolder. `reporting-labs` comes from `npm ci` (it is in `devDependencies`), so no global install is needed.
- **reportingLabs artifacts:** `reporting-labs-shard-N` has that shard's `index.html` + `report.pdf`; `merged-reporting-labs-report` has the one HTML for all shards. Download it from the run summary and open `index.html`, no server needed.

---

## 9. Jenkins Sharding (Parallel Stages)

```groovy
stage('Sharded Tests') {
    parallel {
        stage('Shard 1/4') {
            steps {
                dir('qa-tests') {
                    bat 'npx playwright test --shard=1/4'
                }
            }
        }
        stage('Shard 2/4') {
            steps {
                dir('qa-tests') {
                    bat 'npx playwright test --shard=2/4'
                }
            }
        }
        stage('Shard 3/4') {
            steps {
                dir('qa-tests') {
                    bat 'npx playwright test --shard=3/4'
                }
            }
        }
        stage('Shard 4/4') {
            steps {
                dir('qa-tests') {
                    bat 'npx playwright test --shard=4/4'
                }
            }
        }
    }
}
```

**Note:** Jenkins `parallel` runs on same machine (threads). GitHub Actions `matrix` runs on different machines (true parallel). GitHub Actions approach is better for real sharding.

### Jenkins + reportingLabs

All 4 stages run in the same `qa-tests` folder at the same time, so give each shard its own reportingLabs folder with `REPORTING_LABS_OUTPUT_FOLDER`, and its own Playwright `test-results` folder with `--output` (otherwise the shards overwrite each other), then merge them in one more stage:

```groovy
stage('Sharded Tests') {
    parallel {
        stage('Shard 1/4') {
            steps {
                dir('qa-tests') {
                    withEnv(['REPORTING_LABS_OUTPUT_FOLDER=rl-shards/s1']) {
                        bat 'npx playwright test --shard=1/4 --output=test-results/s1'
                    }
                }
            }
        }
        stage('Shard 2/4') {
            steps {
                dir('qa-tests') {
                    withEnv(['REPORTING_LABS_OUTPUT_FOLDER=rl-shards/s2']) {
                        bat 'npx playwright test --shard=2/4 --output=test-results/s2'
                    }
                }
            }
        }
        stage('Shard 3/4') {
            steps {
                dir('qa-tests') {
                    withEnv(['REPORTING_LABS_OUTPUT_FOLDER=rl-shards/s3']) {
                        bat 'npx playwright test --shard=3/4 --output=test-results/s3'
                    }
                }
            }
        }
        stage('Shard 4/4') {
            steps {
                dir('qa-tests') {
                    withEnv(['REPORTING_LABS_OUTPUT_FOLDER=rl-shards/s4']) {
                        bat 'npx playwright test --shard=4/4 --output=test-results/s4'
                    }
                }
            }
        }
    }
}
stage('Merge reportingLabs Report') {                              // reportingLabs
    steps {
        dir('qa-tests') {
            bat 'npx reporting-labs merge rl-shards -o reporting-labs-merged'
            archiveArtifacts artifacts: 'reporting-labs-merged/**, rl-shards/**/report.pdf', allowEmptyArchive: true
        }
    }
}
```

- Clean the old folders before the run (`bat 'if exist rl-shards rmdir /s /q rl-shards'`), so a shard from yesterday is not merged in.
- `--output=test-results/sN` matters too: 4 runs in one folder share Playwright's own `test-results/`, and each run clears it when it starts, which can crash another shard with `ENOENT ... .playwright-artifacts`.
- If a shard fails, Jenkins marks that stage failed and still runs the others. Put `catchError(buildResult: 'FAILURE', stageResult: 'FAILURE')` around each `bat` if you want the merge stage to run even then.
- Open `reporting-labs-merged/index.html` from the build's artifacts. The HTML Publisher plugin can also show it on the build page.

---

## 10. Where to Run Shards — Comparison

| Platform | How | True Parallel? | Best For |
|---|---|---|---|
| CLI (local) | 4 terminals manually | Manual effort | Quick testing |
| Docker Compose | 1 command, 4 containers | Yes — isolated | Local parallel |
| GitHub Actions | Matrix strategy, 4 VMs | Yes — separate machines | CI/CD |
| Jenkins | `parallel {}` stages | Same machine (threads) | Self-hosted CI |

---

## 11. Speed Comparison

| Setup | 52 Tests | Time |
|---|---|---|
| No sharding, 1 worker | Sequential | ~5 min |
| No sharding, 4 workers | Parallel on 1 machine | ~1.5 min |
| 4 shards, 1 worker each | Split across 4 machines | ~1.2 min |
| 4 shards, 2 workers each | Split + parallel | ~40 sec |
| 8 shards, 2 workers each | Maximum split | ~20 sec |

---

## 12. When to Use Sharding

| Test Count | Approach |
|---|---|
| < 50 tests | `fullyParallel: true` — enough |
| 50-200 tests | 2-4 shards |
| 200-500 tests | 4-8 shards |
| 500+ tests | 8+ shards + parallel workers |

---

## 13. File Placement

```
project-root/
├── Dockerfile
├── .dockerignore
├── docker-compose.shard.yml        ← Docker sharding
├── Jenkinsfile
├── .github/
│   └── workflows/
│       └── sharded-tests.yml       ← GitHub Actions sharding
├── playwright.config.ts            ← blob reporter config
├── src/
├── tests/
└── config/
    └── .env.qa
```

---

## 14. .gitignore (Add These)

```
blob-report/
blob-shard-*/
all-blob-reports/
all-allure-results/
merged-allure-report/
reports-shard*/
allure-shard*/

# reportingLabs
reporting-labs/
rl-shard*/
rl-shards/
all-rl-shards/
reporting-labs-merged/
reporting-labs.history.json
```

---

## 15. Troubleshooting

| Issue | Fix |
|---|---|
| `merge-reports` fails | Blob reporter not enabled — add `["blob"]` to config |
| Merged report shows 0 tests | Blob files missing — check blob-report/ folders |
| Docker containers crash | Memory issue — increase Docker memory to 4GB+, use `workers: 1` |
| Shard reports show partial tests | Expected — each shard only runs its portion |
| Uneven test distribution | Normal — Playwright distributes as evenly as possible |
| GitHub Actions matrix not parallel | Check `fail-fast: false` is set |
| Jenkins shards slow | Jenkins `parallel` is threads, not true machines — expected |
| `reporting-labs merge`: "no report.json" | The shard folders are missing or empty — check the `mv reporting-labs rl-shard-N` lines / the artifact names |
| reportingLabs merged report has fewer tests | One shard's folder was not passed to `merge` (or its artifact was not downloaded) |
| reportingLabs shards overwrite each other (Jenkins, parallel in one folder) | Set a different `REPORTING_LABS_OUTPUT_FOLDER` and `--output` per shard, as in section 9 |
| Merged Timeline shows `S1·w0`, `S2·w0` … | Expected: one row per worker of each shard |
| No `report.pdf` in a shard folder | No Chromium-based browser on that machine — run `npx playwright install chromium`, or set `CHROME_PATH` |

---

## 16. Quick Reference Commands

```bash
# ── CLI ───────────────────────────────
npx playwright test --shard=1/4                       # Run shard 1
npx playwright test --shard=1/4 --list                # List shard 1 tests
npx playwright merge-reports --reporter=html ./blobs  # Merge reports

# ── Docker ────────────────────────────
docker-compose -f docker-compose.shard.yml up --build  # Run 4 shards parallel
docker-compose -f docker-compose.shard.yml down        # Stop all

# ── Allure ────────────────────────────
npx allure generate results --clean -o report          # Generate report
npx allure open report                                 # Open report

# ── reportingLabs ─────────────────────
npm i -D reporting-labs@latest                         # Install once
npx reporting-labs merge rl-shard-1 rl-shard-2 -o merged   # Merge shard folders
npx reporting-labs merge all-rl-shards -o merged       # Merge every subfolder
# Several shards at once in one folder: one folder each
REPORTING_LABS_OUTPUT_FOLDER=rl-shards/s1 npx playwright test --shard=1/4 --output=test-results/s1 &
```

---

**Framework Repo:** https://github.com/naveenanimation20/OpenCartWebAPIFramework

**reportingLabs:** https://reportinglabs.dev · Sharding docs: https://reportinglabs.dev/features/sharding

**Naveen Automation Labs** | © 2026
