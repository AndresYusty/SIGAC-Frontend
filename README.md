# SIGAC frontend

Angular 22 (standalone components, signals, lazy routes) client for the SIGAC backend.

## Commands

| Command                     | Purpose                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `npm start`                 | Dev server on `http://localhost:4200`, proxies `/api` to the backend |
| `npm run build`             | Production build into `dist/sigac-frontend`                          |
| `npm run lint:architecture` | Checks the module boundaries described below                         |

## Frontend architecture: modular

The app mirrors the backend modular monolith. Each feature lives in its own module and only exposes
a public API; shared infrastructure is split into layers with one-way dependencies.

```
src/app/
├── core/            singletons and infrastructure, no UI
│   ├── auth/        AuthService, guards, interceptor, auth models, role groups
│   ├── http/        ApiError, Page, query helpers
│   ├── i18n/        I18nService
│   └── ui/          ToastService, ConfirmService
├── shared/          reusable, stateless building blocks
│   ├── components/  LangSwitchComponent
│   ├── pipes/       translate (t), localDate
│   └── utils/       file download helpers, status tones
├── layout/          ShellComponent (top bar, navigation)
├── modules/
│   ├── users/       login, profile, users, hierarchy, settings
│   ├── templates/   minutes templates
│   ├── requests/    council requests, sessions and agenda
│   ├── session/     live session (attendance, quorum, decisions)
│   ├── minutes/     minutes drafting and signature
│   └── repository/  public repository, audit, dashboard
├── i18n/            en.json, es.json
├── app.routes.ts    composes the routes of every module
└── app.config.ts
```

Each module follows the same layout:

```
modules/<module>/
├── index.ts             public API: the module's *Api service and models
├── <module>.api.ts      HTTP client for the module's backend endpoints
├── <module>.models.ts   DTOs, payloads and constants
├── <module>.routes.ts   lazy routes, wired only by app.routes.ts
└── pages/               routed page components (.ts + .html)
```

### Dependency rules

- `core` imports only `core`; `shared` imports `core` and `shared`; `layout` imports `core`, `shared`
  and `layout`.
- Modules never import `layout` or root files.
- Inside a module use relative imports; another module is imported only through its public API
  (`@modules/<name>`), and only if allowed:

| Module       | May use             |
| ------------ | ------------------- |
| `users`      | -                   |
| `templates`  | `users`             |
| `minutes`    | -                   |
| `requests`   | `users`, `minutes`  |
| `session`    | `requests`          |
| `repository` | `users`, `requests` |

These rules are enforced by `scripts/check-architecture.mjs` (`npm run lint:architecture`).

Path aliases (`tsconfig.json`): `@core/*`, `@shared/*`, `@layout/*`, `@modules/*`.
