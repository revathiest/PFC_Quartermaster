# Changelog

## [Unreleased]
### Added
- Automatic OpenAPI documentation generation
- `/api/docs` endpoint serving Swagger UI
- `GET /api/events/:id` and `GET /api/accolades/:id` endpoints
- `/api/uex` search endpoints for terminals and inventory
- Removed `GET /api/uex/items/{name}/terminals` endpoint
- Renamed `GET /api/uex/terminals/{id}/inventory` to `GET /api/uex/terminals/{id}`
- JWT authentication middleware for API routes
- `/api/token` endpoint for JWT exchange

