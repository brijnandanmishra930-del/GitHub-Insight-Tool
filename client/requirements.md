## Packages
(none needed)

## Notes
Frontend assumes server implements routes from @shared/routes with cookie credentials enabled.
If POST /api/github/analyses returns 503, UI shows a “GitHub rate limit” banner with retry CTA.
Dark mode uses class strategy (tailwind darkMode: ["class"]); theme toggle stores preference in localStorage.
