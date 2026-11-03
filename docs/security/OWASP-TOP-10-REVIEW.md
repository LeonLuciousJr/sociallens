| # | Category | Status in SocialLens | Action |
|---|---|---|---|
| A01 | Broken Access Control | Access control properly applied to all routes through Django | No action needed, verified only |
| A02 | Cryptographic Failures | Passwords already hashed with bcrypt; JWT uses a secure, generated string | No action needed, verified only |
| A03 | Injection | Django's ORM parameterized queries already prevent SQL injection by default; verified, not fixed | No action needed, verified only |
| A04 | Insecure Design | Found: no limits on image size present | Deferred, flagged |
| A05 | Security Misconfiguration | We are not deploying until next milestone | Deferred |
| A06 | Vulnerable/Outdated Components | Addressed by `npm audit` for frontend and `uv audit` for backend | No action needed |
| A07 | Authentication Failures | found: No rate limiting for login attempts | Rate limiting added for login and registration, no action needed |
| A08 | Software/Data Integrity | Only using trusted packages, and we have a code review process to minimize the chance that malicious code or configuration could be introduced | Currently, no action needed |
| A09 | Logging/Monitoring Failures | Found: no logging at all on failed login attempts | Logging added to failed login attempts, no action needed |
| A10 | SSRF | Not yet applicable — no feature fetches a user-supplied URL; flagged for when avatar-by-URL is built | Flagged for future work |