# Security Policy

## Supported Versions

Security fixes are provided for the active `main` branch.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

1. Open a private security advisory in GitHub: [Security Advisories](https://github.com/giselleevita/sai-platform/security/advisories/new)
2. Include:
   - Affected component/path
   - Reproduction steps or PoC
   - Impact assessment
   - Suggested mitigation (if known)

## Response Targets

- Initial acknowledgement: within 2 business days
- Triage decision (valid / needs more info / out of scope): within 5 business days
- Remediation plan for valid issues: within 10 business days

## Scope

In scope:
- Authentication and authorization bypass
- CSRF, SSRF, SQL injection, command injection
- Secret exposure, insecure defaults, sensitive data leaks

Out of scope:
- Purely theoretical issues without realistic exploit path
- Vulnerabilities in unsupported forks or modified deployments

## Disclosure

After a fix is released, coordinated disclosure is welcome.
