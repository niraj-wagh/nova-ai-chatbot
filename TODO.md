# TODO - Remove comments from code files (env files unchanged)

## Plan
- [x] Identify/comment sources in JS controllers/services/routes/components and remove them.
- [ ] Remove all line comments (`// ...`) and block comments (`/* ... */`) from backend JS and frontend JS/TS code files.
- [ ] Remove all HTML/JSX comments (`<!-- ... -->` and `{/* ... */}`) from frontend code files.
- [ ] Exclude env/config files (e.g., `.env*`, `docker-compose.yml` if it contains env-like values, etc.) from comment removal.
- [ ] Exclude `frontend/.next/**` and `backend/node_modules/**` from edits.
- [ ] Run a build/test command if available (npm test / npm run build) to ensure no syntax errors.

