# DISASTER RECOVERY — aibotcoder.com (GitHub Pages static site)

*Written 2026-07-03 from a live read-only audit (repo, `gh api`, `dig`, `curl`, `whois`). Reader assumption: you know nothing. Every command is copy-pasteable.*
*Amended 2026-07-03 after a zero-context fire drill: corrected the native Pages fallback URL (was wrongly `aibotcoder.github.io`), added a §4 triage router, and added the 5.1 "did my commit actually deploy?" SHA-comparison block.*

---

## 1. WHAT IT IS

aibotcoder.com is AIBC's public marketing site — a plain static HTML repo (`/Users/jocksolo/Projects/aibc/aibotcoder-deploy`) served directly by GitHub Pages from `main`; every `git push origin main` IS the deploy (no build step). **Google Ads spends $30/day driving traffic to `/ai-phone-receptionist.html` and the missed-call calculator — if this site is down, ad money burns into a dead page.** It also hosts `/sms-optin.html`, the compliance page Twilio's pending A2P campaign approval points at, plus client preview/welcome pages and images referenced by already-sent sales emails.

---

## 2. THE MAP

### Repo / deploy
| Thing | Value (verified 2026-07-03) |
|---|---|
| Local repo | `/Users/jocksolo/Projects/aibc/aibotcoder-deploy` |
| Remote | `git@github.com:HeTron/aibotcoder.github.io.git` (origin, fetch+push) |
| Branch | `main` (only branch; Pages serves it) |
| GitHub identity | **HeTron** (= jcode2k / AIBC). The user-scope git hook blocks pushes to any other owner. |
| Pages config | `build_type: legacy`, source = branch `main`, path `/`, custom domain (cname) `aibotcoder.com`, `https_enforced: true` |
| HTTPS cert | GitHub-managed, state `approved`, covers `aibotcoder.com` + `www.aibotcoder.com`, **expires 2026-09-04** (GitHub auto-renews; see failure mode 5) |
| Deploy latency | push → live in ~30–60s (last observed build: 24s) |
| CNAME file | `/Users/jocksolo/Projects/aibc/aibotcoder-deploy/CNAME` containing exactly `aibotcoder.com` (no trailing newline required) |

Read Pages state any time (read-only):
```bash
gh api repos/HeTron/aibotcoder.github.io/pages
gh api repos/HeTron/aibotcoder.github.io/pages/builds/latest
```

**Native Pages URL (important):** despite the repo's name, this is a *project* site under user **HeTron**, so its GitHub-native URL is `https://hetron.github.io/aibotcoder.github.io/` — **NOT** `https://aibotcoder.github.io` (that would be the user site of a GitHub account literally named "aibotcoder", which isn't ours; it 404s, always). While the custom domain is bound, the native URL 301s to `https://aibotcoder.com/` (verified 2026-07-03). If the custom domain unbinds (failure mode 5.3), content should serve directly at the native URL (UNVERIFIED — can't test without unbinding the domain).

### DNS (host = **Namecheap BasicDNS**, NOT Cloudflare)
Nameservers: `dns1.registrar-servers.com` / `dns2.registrar-servers.com` (= Namecheap's own DNS). Registrar = **Namecheap** (login = the jcode2k/AIBC Namecheap account). The Cloudflare *analytics beacon* on pages is just JS — Cloudflare does NOT sit in front of this site and does not host its DNS.

**Recorded-good records for `aibotcoder.com` (verified live 2026-07-03):**
| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `aibotcoder.github.io.` |
| TXT | `@` | `v=spf1 include:amazonses.com -all` *(the 7/03 SPF fix — Resend sends via Amazon SES; do not remove)* |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |
| MX | `@` | *(none returned at audit time — domain sends via Resend, doesn't receive)* |

Domain expiries (whois, 2026-07-03): **aibotcoder.com → 2027-01-28** · tryaibotcoder.com → 2027-07-02 · getaibotcoder.com → 2027-07-02. All at Namecheap.

### Redirect domains (brand variants)
- `tryaibotcoder.com` (A `162.255.119.92`) and `getaibotcoder.com` (A `162.255.119.28`) → **Namecheap URL Forward** service (configured in the Namecheap dashboard per-domain under Domain → Redirect Domain), NOT in this repo, NOT Cloudflare.
- Verified: `http://tryaibotcoder.com` → 301 `https://aibotcoder.com/` · `http://getaibotcoder.com` → 301 `http://aibotcoder.com/` (note: **http**, not https — minor inconsistency, works via the site's own upgrade).
- **Known gap: HTTPS on the redirect domains fails outright** (`curl https://tryaibotcoder.com` = connection failure). Namecheap URL Forward serves no TLS cert. Acceptable today (these domains exist for outreach-email deliverability, not traffic), but anyone typing `https://try…` gets an error.
- These domains also carry their own email auth DNS (SPF/DKIM/DMARC/MX for the Smartlead warming inboxes) — **do not touch their DNS** while fixing the website; you'd torch the warming senders.

### Load-bearing paths (all returned HTTP 200 on 2026-07-03)
| Path | Why it matters |
|---|---|
| `/ai-phone-receptionist.html` | **Google Ads landing page ($30/day live)** + demo-transfer CTA + ad-spot videos (`static/video/`) |
| `/missed-call-calculator.html` | Ads tool page; carries the **Google Ads conversion tag** `AW-18284786991` (event `EeLuCKvZ78ccEK_q7o5E`, honeypot-guarded) — the conversion signal for the whole campaign |
| `/sms-optin.html` | **Twilio A2P compliance page** — 4th campaign submission references it; consent checkbox must stay OPTIONAL (commit `b1d37d9`) |
| `/preview/allfamilydentaldoctor/` · `/preview/lauderhill-mall-dental/` | Client-site sales previews (noindex meta in each `index.html`, deliberately absent from `sitemap.xml`). Deployed by the **site-rebuild skill** in My Exec (`~/Agents/Personal/My Exec/.claude/skills/site-rebuild/scripts/deploy.py` / `golive.py`) — but they're just committed files in this repo; recovery = recover the repo. |
| `/welcome/the-dental-loft.html` | Customer #1 onboarding packet (noindex) |
| `/static/images/email/missed-call-calculator-preview.jpg` + `missed-call-cost-graphic.jpg` | Dragged into cold-call follow-up emails **already sent** — URLs are frozen in prospects' inboxes |
| `/` (index.html) | Homepage + **AI chat widget** — frontend only; it POSTs to `https://aibc-webhooks.jcode2k.workers.dev/chat` (Cloudflare Worker, separate system: repo `HeTron/aibc-webhooks`). Site down = widget down; Worker down = widget errors but site fine. |
| `/privacy.html` · `/terms.html` | A2P SMS disclosures (Twilio campaign requirement) |
| `/robots.txt` · `/sitemap.xml` · `/llms.txt` · `/googleb2ed113c45365dcc.html` | SEO/verification root files — never delete |

### Dashboards / consoles
| What | Where | Identity |
|---|---|---|
| Repo + Pages settings | github.com/HeTron/aibotcoder.github.io → Settings → Pages | GitHub **HeTron** |
| DNS + registrar + URL redirects | Namecheap dashboard (Advanced DNS per domain; Redirect Domain for try/get) | Namecheap (jcode2k/AIBC account) |
| Google Ads (traffic + conversion) | ads.google.com, CID 785-814-1817 | jcode2k |
| Cloudflare Web Analytics (passive traffic view) | Cloudflare dash → Web Analytics | jcode2k |
| Twilio A2P campaign (references sms-optin) | Twilio console | jcode2k/AIBC |

---

## 3. SECRETS INDEX

**None. This is a public static repo — nothing secret may ever be committed to it.**
Public-by-design tokens that LOOK like secrets but aren't:
- Cloudflare Web Analytics beacon token `880dd8a72db2452c816c1172be8b6db7` (in every page's footer script) — public by design.
- Google Ads tag `AW-18284786991` + conversion label (calculator page) — public by design.
- Stripe payment link `buy.stripe.com/5kQ28r9cX6p04Q22PD3VC04` (portfolio page) — public by design.
- Google Search Console verification file `googleb2ed113c45365dcc.html` — public by design.
- `static/Hassan_Eid_Resume_*.pdf` — Jason's resumes, intentionally hosted.

Deploy credential = your local SSH key for GitHub (HeTron). If that's lost: `gh auth login` / re-add SSH key at github.com/settings/keys.

---

## 4. HOW YOU'D KNOW IT'S BROKEN

**Mostly, you wouldn't — there is NO real-time uptime alert on this site.** Verified coverage:

- ✅ **security-scanner (Friday, nightly 3 AM ET)** — `assets.yml` includes `aibotcoder.com` in `web:` (http/TLS dimension), repo `aibotcoder.github.io` in the repos list (deps/secrets), and `aibotcoder.com` + `tryaibotcoder.com` + `getaibotcoder.com` in `domains:` (SPF/DMARC + dangling-CNAME). But it emails jcode2k **only on net-new critical/high, once a night** — up to ~24h of blindness, and a plain "site is 404ing" may not even rank critical.
- ❌ **UptimeRobot** — the only documented monitor is on the phone-system's `/health` (`phone-system-alpha.vercel.app`). **UNVERIFIED whether any UptimeRobot monitor exists for aibotcoder.com** (couldn't check the UptimeRobot dashboard read-only from here); no doc anywhere says one exists, so assume NO.
- ❌ Cloudflare Web Analytics is passive (you'd see traffic drop to zero only if you looked).
- ❌ GitHub Pages build failures notify the pusher by email at best — easy to miss.

**SILENT-GAP FLAG:** site down = **$30/day of Google Ads clicking into a dead landing page**, the Twilio A2P reviewer hitting a 404 on `/sms-optin.html` (= 5th rejection), and client preview links dying mid-demo — all with **zero alarm**.

**FIX — manual UptimeRobot setup, PENDING (checked 2026-07-03: no UptimeRobot API key exists anywhere on this machine — `connections.md` records the account as "dashboard, no API wired", so this can't be automated headlessly):**

1. Log in at **uptimerobot.com** — the account was created 2026-07-01 for the phone-system `/health` monitor. Login identity is likely **jcode2k@gmail.com** (UNVERIFIED — Jason created it manually; try Google SSO with jcode2k first).
2. Open the existing **phone-system `/health`** monitor and note which **alert contact** it uses (almost certainly the jcode2k email contact). Reuse that same contact on the new monitors.
3. **Add New Monitor** ×2 (Monitor Type: **HTTP(s)**, Interval: **5 minutes** — the free-plan floor; Alert Contacts: same as `/health`):
   - Friendly name **"AIBC site — receptionist landing"** → URL `https://aibotcoder.com/ai-phone-receptionist.html` (the Google Ads landing page)
   - Friendly name **"AIBC site — sms-optin A2P"** → URL `https://aibotcoder.com/sms-optin.html` (Twilio A2P compliance page — a 404 here risks another campaign rejection)
4. **Optional 3rd monitor — aibc-webhooks Worker** (`https://aibc-webhooks.jcode2k.workers.dev/poster/run`): this endpoint returns **401 without a secret**, so a plain HTTP monitor would show permanently DOWN. Only add it as a **Keyword monitor** — keyword-exists on `Unauthorized` (verified 2026-07-03: the 401 body is exactly `Unauthorized`). **Never put the CRON/poster secret in a monitor URL.** If keyword monitoring of a 401 isn't workable on the free plan, skip the Worker — the security-scanner's nightly http dimension is the fallback.
5. While in the dashboard: **create a Main API Key** (My Settings → API Settings) and drop it in a local `.env` (e.g. `~/.env.aibc` as `UPTIMEROBOT_API_KEY=`) so future monitor changes can be automated — the absence of this key is why this setup is manual.
6. After ~5–10 min, confirm both new monitors show **Up**, then update this section: flip the ❌ UptimeRobot line above to ✅ and delete this PENDING block.

Manual 30-second health check:
```bash
for u in https://aibotcoder.com https://aibotcoder.com/ai-phone-receptionist.html https://aibotcoder.com/sms-optin.html https://aibotcoder.com/missed-call-calculator.html; do echo "== $u"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 "$u"; done
gh api repos/HeTron/aibotcoder.github.io/pages/builds/latest --jq '.status, .error.message'
```

**Triage router** (which failure mode to open):
- **Every page 404s** → check **5.3** first (`gh api …/pages --jq '.cname'` — null/wrong = domain unbound), then **5.1** (build errored), then **5.2** (DNS). A whole-site 404 with `server: GitHub.com` in the headers means DNS is fine — skip 5.2.
- **Site up but stale after a push** → **5.1**, starting at its "did my commit actually deploy?" block.
- **NXDOMAIN / parking page / not GitHub in headers** → **5.2**.
- **TLS errors** → **5.5**. One missing preview/welcome page → **5.4**.

---

## 5. TOP 5 FAILURE MODES

### 5.1 Pages build failure after a bad push (site stale or 404)
- **Symptom:** you pushed, waited 2+ min, site unchanged — or whole site 404s.
- **Diagnostic — step 1, did my commit actually deploy?** (`status: built` alone is NOT proof — it may describe the *previous* commit's build):
  ```bash
  cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
  git rev-parse HEAD                                                   # what you think you pushed
  gh api repos/HeTron/aibotcoder.github.io/commits/main --jq '.sha'    # what the remote actually has
  gh api repos/HeTron/aibotcoder.github.io/pages/builds/latest --jq '.commit, .status, .updated_at'  # what Pages actually built
  ```
  - Local HEAD ≠ remote SHA → **the push never landed.** Check `git status` / `git log origin/main..main`; common causes: push errored silently, wrong branch, or the user-scope git-push guard hook blocked it. Fix = push again (from a terminal if the hook is the blocker and the push is legitimate).
  - Remote SHA matches HEAD but `builds/latest .commit` is older → build never triggered. Trigger one: `gh api -X POST repos/HeTron/aibotcoder.github.io/pages/builds` (write call — only when this exact state is confirmed).
  - All three SHAs match + `status: built` → **it deployed; you're looking at cache.** Confirm with `curl -sI https://aibotcoder.com/<page> | grep -i last-modified`, then hard-refresh (Cmd+Shift+R).
- **Diagnostic — step 2, build health:**
  ```bash
  gh api repos/HeTron/aibotcoder.github.io/pages/builds/latest --jq '.status, .error.message'
  gh api repos/HeTron/aibotcoder.github.io/pages --jq '.status'
  ```
  `status: "errored"` + an error message = bad push (common causes: deleted `.nojekyll` → Jekyll chokes on the HTML, or a file Jekyll can't parse).
- **Fix (revert the bad commit):**
  ```bash
  cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
  git log --oneline -5                 # identify the bad commit
  git revert --no-edit <BAD_SHA>
  git push origin main
  ```
  If several bad commits, revert the range: `git revert --no-edit <OLDEST_BAD_SHA>^..HEAD`.
- **Verify:** builds/latest shows `built`, then `curl -sI https://aibotcoder.com | head -3` = `HTTP/2 200` and `last-modified` is fresh.

### 5.2 DNS records lost / registrar problem (domain resolves wrong or not at all)
- **Symptom:** browser NXDOMAIN, parking page, or wrong site.
- **Diagnostic:**
  ```bash
  dig +short A aibotcoder.com          # must be the four 185.199.10{8..11}.153
  dig +short CNAME www.aibotcoder.com  # must be aibotcoder.github.io.
  dig +short NS aibotcoder.com         # must be dns{1,2}.registrar-servers.com.
  whois aibotcoder.com | grep -i expir # expiry recorded: 2027-01-28
  ```
- **Fix:** log into **Namecheap** → aibotcoder.com → Advanced DNS → restore exactly the records in **THE MAP §2** (4× A @ → 185.199.108–111.153, CNAME www → aibotcoder.github.io, TXT SPF + _dmarc). If whois shows expired: Namecheap → renew immediately (grace period usually ~30 days). If NS ≠ registrar-servers.com, someone moved DNS — set nameservers back to Namecheap BasicDNS.
- **Verify:** re-run the digs (propagation up to ~30 min on Namecheap's default TTL), then `curl -sI https://aibotcoder.com` = 200 with `server: GitHub.com`.

### 5.3 CNAME file deleted (custom domain breaks; site only at aibotcoder.github.io)
- **Symptom:** aibotcoder.com 404s ("There isn't a GitHub Pages site here") while the native Pages URL `https://hetron.github.io/aibotcoder.github.io/` works; or Pages settings show no custom domain. A push that deletes `CNAME` silently unbinds the domain. **Do NOT test `https://aibotcoder.github.io` — that URL is not ours and 404s even when everything is healthy** (see §2 "Native Pages URL").
- **Diagnostic:**
  ```bash
  cat /Users/jocksolo/Projects/aibc/aibotcoder-deploy/CNAME        # must print: aibotcoder.com
  gh api repos/HeTron/aibotcoder.github.io/pages --jq '.cname'     # must print: aibotcoder.com
  ```
- **Fix:**
  ```bash
  cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
  printf 'aibotcoder.com\n' > CNAME
  git add CNAME && git commit -m "restore CNAME (custom domain)" && git push origin main
  ```
  If the API still shows `cname: null` after the build, set it in the UI: github.com/HeTron/aibotcoder.github.io → Settings → Pages → Custom domain → `aibotcoder.com` → Save, and re-tick **Enforce HTTPS** once the cert check passes.
- **Verify:** `curl -sI https://aibotcoder.com | head -3` = 200; `.https_enforced` = true in `gh api …/pages`.

### 5.4 A preview/welcome slug 404s during a client demo
- **Symptom:** `https://aibotcoder.com/preview/<slug>/` or `/welcome/<slug>.html` = 404.
- **Diagnostic:**
  ```bash
  ls /Users/jocksolo/Projects/aibc/aibotcoder-deploy/preview/ /Users/jocksolo/Projects/aibc/aibotcoder-deploy/welcome/
  cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy && git log --oneline -5 -- preview/ welcome/
  ```
  Known-good slugs (2026-07-03): `preview/allfamilydentaldoctor/`, `preview/lauderhill-mall-dental/`, `welcome/the-dental-loft.html`. Preview URLs need the **trailing slash** (or `/index.html`); check the exact URL first — it's usually a typo, missing trailing slash, or the slug was removed by a commit.
- **Fix:** if the folder exists locally but not live → push wasn't done: `git status`, then commit+push. If deleted in git: `git log --diff-filter=D --oneline -- preview/` to find the deleting commit, then `git checkout <DELETING_SHA>^ -- preview/<slug>` + commit + push. If it never existed, redeploy via the site-rebuild skill (`~/Agents/Personal/My Exec/.claude/skills/site-rebuild/scripts/deploy.py`).
- **Verify:** `curl -s -o /dev/null -w "%{http_code}\n" https://aibotcoder.com/preview/<slug>/` = 200. Stopgap mid-demo: the native URL is `https://hetron.github.io/aibotcoder.github.io/preview/<slug>/` — but while the custom domain is bound it just 301s back to aibotcoder.com (verified 2026-07-03), so it's only a real stopgap when the custom domain is the thing that's broken (5.3). If the custom domain is fine and the slug 404s, there is no alternate URL — fix the content.

### 5.5 Certificate / HTTPS issues
- **Symptom:** browser TLS warning, or `curl` cert errors on aibotcoder.com.
- **Diagnostic:**
  ```bash
  gh api repos/HeTron/aibotcoder.github.io/pages --jq '.https_certificate, .https_enforced'
  echo | openssl s_client -connect aibotcoder.com:443 -servername aibotcoder.com 2>/dev/null | openssl x509 -noout -dates
  ```
  Recorded state 2026-07-03: `approved`, covers apex + www, expires **2026-09-04**, GitHub auto-renews (renewal only succeeds while DNS points at GitHub — a DNS outage near expiry blocks renewal).
- **Fix:** first fix DNS if 5.2 applies (cert issuance depends on it). Then in GitHub → Settings → Pages: **Remove** the custom domain, wait ~1 min, re-add `aibotcoder.com` — this forces a fresh Let's Encrypt issuance. Re-enable **Enforce HTTPS** when the check turns green (can take up to ~1 hour).
- **Verify:** the `gh api` cert state back to `approved` with a future `expires_at`; `curl -sI https://aibotcoder.com` clean 200.
- **Note:** `https://tryaibotcoder.com` / `https://getaibotcoder.com` failing TLS is **normal** (Namecheap URL Forward has no cert — see §2). Don't chase that as a site outage.

---

## 6. RESTART / REDEPLOY FROM ZERO

Total loss scenario (laptop gone AND/OR repo gone). Any machine with git + gh authenticated as **HeTron**:

```bash
# 1. Get the content back
git clone git@github.com:HeTron/aibotcoder.github.io.git /Users/jocksolo/Projects/aibc/aibotcoder-deploy
# (If GitHub repo itself is gone: restore from any local clone / Time Machine, then:)
#   cd <restored-folder>
#   gh repo create HeTron/aibotcoder.github.io --public --source . --push

# 2. Confirm the two deploy-critical files exist
cat /Users/jocksolo/Projects/aibc/aibotcoder-deploy/CNAME        # -> aibotcoder.com
ls /Users/jocksolo/Projects/aibc/aibotcoder-deploy/.nojekyll     # must exist

# 3. Push (this IS the deploy)
cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
git push origin main

# 4. Re-enable Pages if disabled (read current state first)
gh api repos/HeTron/aibotcoder.github.io/pages || \
gh api -X POST repos/HeTron/aibotcoder.github.io/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
# Then set custom domain:
gh api -X PUT repos/HeTron/aibotcoder.github.io/pages -f cname=aibotcoder.com
# Enforce HTTPS once cert issues (or tick it in Settings -> Pages):
gh api -X PUT repos/HeTron/aibotcoder.github.io/pages -F https_enforced=true
```

**5. Re-point DNS at Namecheap** (aibotcoder.com → Advanced DNS) — exact records:
```text
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    aibotcoder.github.io.
TXT    @      v=spf1 include:amazonses.com -all
TXT    _dmarc v=DMARC1; p=none;
```
Redirect domains (only if they were also lost): Namecheap → tryaibotcoder.com / getaibotcoder.com → Domain → **Redirect Domain** → 301 permanent to `https://aibotcoder.com/`. **Do not** touch those domains' other records (Smartlead email auth lives there).

**6. Verify end-to-end:**
```bash
dig +short A aibotcoder.com                      # four 185.199.* IPs
gh api repos/HeTron/aibotcoder.github.io/pages/builds/latest --jq '.status'   # built
for u in https://aibotcoder.com https://aibotcoder.com/ai-phone-receptionist.html https://aibotcoder.com/sms-optin.html https://aibotcoder.com/missed-call-calculator.html https://aibotcoder.com/preview/allfamilydentaldoctor/ https://aibotcoder.com/welcome/the-dental-loft.html https://aibotcoder.com/static/images/email/missed-call-cost-graphic.jpg; do echo "== $u"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 "$u"; done   # all 200
curl -sI http://tryaibotcoder.com | grep -i location   # -> https://aibotcoder.com/
```

---

## 7. KILL SWITCH

Rarely needed for a static site — there's no server to stop. Two scoped moves:

**Take down ONE page/preview without touching the rest** (e.g. a client asked their preview removed):
```bash
cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
git rm -r preview/<slug>            # or: git rm welcome/<slug>.html / <page>.html
git commit -m "remove <slug>"
git push origin main                # gone from the live site in ~60s
```
(Per house policy, prefer moving content to an archive over deleting — but `git rm` never destroys history; `git checkout <SHA>^ -- <path>` brings anything back.)

**Roll the whole site back to a known-good commit** (keeps history, no force-push):
```bash
cd /Users/jocksolo/Projects/aibc/aibotcoder-deploy
git log --oneline -10                                   # pick GOOD_SHA
git revert --no-edit <BAD_SHA>                          # single bad commit
# OR nuke everything after GOOD_SHA in one commit:
git checkout <GOOD_SHA> -- . && git commit -m "roll back site to <GOOD_SHA>" && git push origin main
```
Known-good reference point at audit time: `b1d37d9` (2026-07-03, Pages build `built`, all load-bearing paths 200).

**Whole-site emergency takedown** (should basically never happen): GitHub → Settings → Pages → "Unpublish site". Remember ads keep sending traffic — pause the Google Ads campaign (CID 785-814-1817) in the same breath.

---

## 8. DO-NOT-TOUCH

1. **`~/Projects/aibc/MyPortfolio/deploy.sh` — NEVER run it.** The script was deleted 2026-05-14, but if any copy resurfaces it will overwrite/delete most of this repo with a stale 2025 "Hassan Eid" Flask export. The Flask source at `~/Projects/aibc/MyPortfolio/` is orphaned — **STALE DOC/SOURCE: do not deploy from it.** The only deploy workflow is: edit files in this repo → `git push origin main`. (Documented in this repo's `CLAUDE.md` "Things to NEVER do" — verified present.)
2. **`sms-optin.html` consent semantics (commit `b1d37d9`).** The SMS consent checkbox must stay **OPTIONAL** — no `required` attribute, form submits without it, copy says consent is not a condition. Twilio rejected the A2P campaign 3× (final error `30923`) precisely because consent looked mandatory; the pending 4th submission depends on this exact state. Verified 2026-07-03: `<input type="checkbox" id="consent" name="consent">` has no `required`. Don't "clean up" this page.
3. **`/preview/*` and `/welcome/*` stay noindex + out of `sitemap.xml`.** Every preview/welcome page carries a noindex meta tag and none appear in the sitemap (verified). Adding them to the sitemap or stripping noindex leaks client previews into search.
4. **`/static/images/email/*` — frozen URLs.** These images are embedded/linked in cold-call follow-up emails already sitting in prospects' inboxes. Renaming or moving them breaks every sent email retroactively.
5. **`/missed-call-calculator.html` script block** — the Google Ads conversion fire (`AW-18284786991/EeLuCKvZ78ccEK_q7o5E`, honeypot-guarded) and the element IDs/POST to the Worker `/calculator` must survive any edit. Also the base gtag in its `<head>`.
6. **Root SEO/verification files** — `CNAME`, `.nojekyll`, `sitemap.xml`, `robots.txt`, `llms.txt`, `manifest.json`, `googleb2ed113c45365dcc.html`: never delete. Deleting `.nojekyll` can break the build (Jekyll processing); deleting `CNAME` unbinds the domain (failure mode 5.3).
7. **`index.html` mobile WebGL guard** (`ENABLE_3D` desktop-only gate) — re-enabling continuous WebGL on mobile crashes iOS Safari (see repo CLAUDE.md).
8. **tryaibotcoder.com / getaibotcoder.com DNS** — carries Smartlead warming-inbox email auth (SPF/DKIM/DMARC/MX). Website work never touches those zones beyond the URL-forward setting.
9. **`static/style.css` + `static/brand/` SVGs** — unreferenced since the 2026-06-13 redesign but kept per archive-don't-delete policy. Ignore them; don't re-link them.
10. This site has no `/media` path; the only external systems fetching from it are Gmail clients (email images, #4), Google Ads/Twilio reviewers (#2, #5), and the chat widget's own JS (backend is the separate `aibc-webhooks` Worker — its outage is NOT this site's outage).
