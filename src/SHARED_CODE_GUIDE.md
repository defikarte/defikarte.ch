# Quick Start Guide: Using Shared Code

## Overview

The `@defikarte/shared` package contains code that is shared between the CapacitorJS + React mobile app and the React web application. Both applications use **MapLibre GL JS** for map rendering. This guide will help you understand how to use and extend the shared code.

## How It Works

This project uses **pnpm workspaces** to manage multiple packages in a single repository. Each package (app and web) has its own `pnpm-workspace.yaml` file that references the shared package:

```
defikarte.ch/src/
├── app/
│   ├── pnpm-workspace.yaml    # References ../shared
│   ├── package.json            # Contains "@defikarte/shared": "workspace:*"
│   └── ...                     # CapacitorJS + React mobile app
├── web/
│   ├── pnpm-workspace.yaml    # References ../shared
│   ├── package.json            # Contains "@defikarte/shared": "workspace:*"
│   └── ...                     # React Vite app
└── shared/
    ├── package.json            # Shared package definition
    └── src/
        ├── index.ts            # Main export file
        ├── api/                # API client code
        ├── configuration/      # Shared configurations
        ├── map/                # Map-related utilities
        ├── model/              # TypeScript types and models
        └── services/           # Shared services
```

When you run `pnpm install` in either the `app/` or `web/` directory, pnpm automatically creates symlinks to the shared package in `node_modules/@defikarte/shared`.

## Using Shared Code

### Step 1: Import from the Shared Package

In any file in `/app` or `/web`:

```typescript
import { ApiClient } from "@defikarte/shared";
import type { RequestOptions, ApiConfiguration } from "@defikarte/shared";
```

### Step 2: Use the Shared Code

**Example: API Client**

```typescript
import { ApiClient } from "@defikarte/shared";

const apiConfig: ApiConfiguration = {
  baseUrl: "https://api.example.com",
  timeout: 5000,
};

const client = new ApiClient(apiConfig);

// Make API calls
const data = await client.get("/endpoint");
```

## Adding New Shared Code

### Step 1: Create Your File

Add a new file in the appropriate subdirectory of `/shared/src/`:

```typescript
// /shared/src/services/my-service.ts
export class MyService {
  public processData(input: string): string {
    return `Processed: ${input}`;
  }
}
```

### Step 2: Export from Index

Update `/shared/src/index.ts`:

```typescript
// Add this line
export { MyService } from "./services/my-service";
```

### Step 3: Use It

No need to reinstall! The workspace is already linked:

```typescript
import { MyService } from "@defikarte/shared";

const service = new MyService();
service.processData("Hello"); // "Processed: Hello"
```

## TypeScript Support

TypeScript automatically picks up types from the shared package because:

1. The shared package's `package.json` specifies: `"main": "src/index.ts"` and `"types": "src/index.ts"`
2. Both app (CapacitorJS + React) and web (React + Vite) projects have TypeScript configured
3. pnpm workspaces create proper symlinks with the `workspace:*` protocol

## Current Shared Package Structure

The shared package currently includes:

- **API Client** (`/api/api-client.ts`): HTTP client for making API requests
- **Configuration** (`/configuration/`): Shared configuration files
- **Map** (`/map/`): Map-related utilities and helpers (MapLibre GL JS configuration, styles, layers)
- **Models** (`/model/`): TypeScript types, interfaces, and data models
- **Services** (`/services/`): Business logic and shared services
- **UI Components** (`/components/`): React components that work across mobile and web

## Development Tips

### 1. Hot Reload Works

Changes in `/shared` will trigger hot reload in both app and web (as long as dev servers are running).

### 2. Keep It Platform-Agnostic

Only put code in `/shared` that works on both the mobile app and web app:

- ✅ Pure utility functions
- ✅ React hooks (using platform-agnostic APIs)
- ✅ TypeScript types/interfaces
- ✅ Business logic
- ✅ API clients (using axios or fetch)
- ✅ MapLibre GL JS code (map styles, layers, sources, etc.)
- ✅ React UI components (buttons, cards, forms, etc.)
- ✅ Shared styling (CSS/Tailwind classes)
- ❌ Platform-specific navigation code
- ❌ Capacitor plugins (keep these in the mobile app)
- ❌ Browser-only APIs (`localStorage`, `document.cookie`, etc. - use Capacitor Preferences API wrapper instead)

**Note:** Since both apps use React and MapLibre GL JS, you can share:

- Map configuration and styling
- MapLibre GL JS layer definitions
- Map interaction logic
- GeoJSON data processing utilities
- **React UI components** - buttons, cards, modals, forms, etc.
- **React hooks** - custom hooks for state management, API calls, etc.
- **Styling utilities** - shared CSS classes, theme configurations

### 3. Dependencies in Shared Package

The shared package currently has:

**Dependencies:**

- `axios`: ^1.13.2 - HTTP client for API calls
- `geojson`: ^0.5.0 - GeoJSON type definitions

**Peer Dependencies:**

- `react`: >=18.0.0 - Required for React hooks

If your shared code needs a new library, add it to `/shared/package.json`:

```bash
cd shared
pnpm add <package-name>
```

Then reinstall in both app and web:

```bash
cd ../app && pnpm install
cd ../web && pnpm install
```

### 4. Working with pnpm Workspaces

To install dependencies in a specific workspace:

```bash
# From the app directory
cd src/app
pnpm install

# From the web directory
cd src/web
pnpm install
```

The `workspace:*` protocol in package.json ensures both projects always use the local shared package.

## Common Patterns

### Shared Types/Interfaces

```typescript
// /shared/src/model/location.ts
export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
}

// Export from index.ts
export type { Location } from "./model/location";
```

### Shared API Client

```typescript
// /shared/src/api/api-client.ts
import axios, { type AxiosInstance } from "axios";

export class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiConfiguration) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.data;
  }
}
```

### Shared Configuration

```typescript
// /shared/src/configuration/map-config.ts
export const MAP_CONFIG = {
  defaultCenter: {
    latitude: 46.8182,
    longitude: 8.2275,
  },
  defaultZoom: 8,
};
```

## Troubleshooting

### "Cannot find module '@defikarte/shared'"

Run from the app or web directory:

```bash
cd src/app  # or cd src/web
pnpm install
```

### Changes in `/shared` Not Reflected

1. Make sure your dev server is running
2. Try stopping and restarting the dev server:
   - App: `cd src/app && pnpm start`
   - Web: `cd src/web && pnpm dev`
3. Clear the cache:
   - App: `cd src/app && pnpm start -- --clear`
   - Web: Delete `src/web/node_modules/.vite` folder

### TypeScript Errors in Shared Package

Make sure dependencies are installed in the shared package:

```bash
cd src/shared
pnpm install
```

Also ensure that both app and web have installed the shared package:

```bash
cd src/app && pnpm install
cd src/web && pnpm install
```

### Workspace Link Issues

If the workspace link is broken, try:

```bash
cd src/app
rm -rf node_modules pnpm-lock.yaml
pnpm install

cd ../web
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Need Help?

Check the existing shared code structure:

- `/shared/src/api/` - API client implementations
- `/shared/src/configuration/` - Shared configurations
- `/shared/src/map/` - Map-related utilities
- `/shared/src/model/` - TypeScript types and models
- `/shared/src/services/` - Business logic services
- `/shared/src/index.ts` - Main export file

For more information about the project structure, see the main README files in each package.
