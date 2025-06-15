# Changelog

## [Unreleased]
### Added
- Automatic OpenAPI documentation generation
- `/api/docs` endpoint serving Swagger UI
- `GET /api/events/:id` and `GET /api/accolades/:id` endpoints
- `GET /api/activity-log/event-types` endpoint returning unique event types
- Removed `/api/uex/terminals` and `/api/uex/terminals/{id}` endpoints
- `/api/accolades` endpoints are now public (no JWT required)
- `GET /api/officers` endpoint listing officers and their bios
- `/api/officers` endpoint is now public (no JWT required)
- `/officerbio` slash command allowing officers to set their bio
- Removed `GET /api/uex/items/{name}/terminals` endpoint
- Renamed `GET /api/uex/terminals/{id}/inventory` to `GET /api/uex/terminals/{id}`
- JWT authentication middleware for API routes
- `/api/token` endpoint for JWT exchange
- Swagger UI now supports Bearer token authentication via the **Authorize** button
- `/apitoken` command for generating JWTs via Discord
- `/apitoken` tokens now expire after 30 minutes
- `PUT /api/content/{section}` endpoint for updating site content (admin only)
- Activity log search endpoint under `/api`
- Activity log search results now include channel and member details
- `GET /api/members` endpoint to list Discord guild members
- `GET /api/members` now includes each member's displayName
- `GET /api/profile/{userId}` endpoint for member profile info
- `/api/profile/{userId}` now returns Discord profile details alongside RSI data
- `/api/commands` and `/api/command/{command}` endpoints for command details
- `/api/commands` now returns command names without the leading `/`
- Documented `/api/activity-log/search` parameters and request body in Swagger

### Fixed
- Officer endpoint incorrectly marked as secured in Swagger docs
