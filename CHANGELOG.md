# Changelog

## [Unreleased]
### Added
- Automatic OpenAPI documentation generation
- `/api/docs` endpoint serving Swagger UI
- `GET /api/events/:id` and `GET /api/accolades/:id` endpoints
- Removed `/api/uex/terminals` and `/api/uex/terminals/{id}` endpoints
- `/api/accolades` endpoints are now public (no JWT required)
- Removed `GET /api/uex/items/{name}/terminals` endpoint
- Renamed `GET /api/uex/terminals/{id}/inventory` to `GET /api/uex/terminals/{id}`
- JWT authentication middleware for API routes
- `/api/token` endpoint for JWT exchange
- Swagger UI now supports Bearer token authentication via the **Authorize** button
- `/apitoken` command for generating JWTs via Discord
- Activity log search endpoint under `/api`
- Activity log search results now include channel and member details
- `GET /api/members` endpoint to list Discord guild members
- `GET /api/profile/{userId}` endpoint for member profile info
- `/api/commands` and `/api/command/{command}` endpoints for command details
- `/api/commands` now returns command names without the leading `/`
