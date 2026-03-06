# Lightning Server Simplified

A TypeScript library providing web tools and client utilities for interacting with [Lightning Server](https://github.com/lightningkite/lightning-server), a Kotlin backend framework.

## Installation

```bash
npm install @lightningkite/lightning-server-simplified
```

## Usage

### REST Endpoints

This library provides a `RestEndpoint` interface for CRUD operations on resources:

```typescript
import { RestEndpoint } from '@lightningkite/lightning-server-simplified';

// Assuming you have a RestEndpoint instance for a User model
const users: RestEndpoint<User> = /* ... */;

// Query users
const userList = await users.query({ condition: { name: { Equal: "John Doe" } } });

// Insert a new user
const newUser = await users.insert({ _id: 'user-id', name: 'John Doe', email: 'john@example.com' });

// Modify a user
const updatedUser = await users.modify('user-id', { name: { Assign: 'Jane Doe' } });
```

### Conditions and Modifications

Use `Condition` and `Modification` types to build complex queries and updates:

```typescript
import { Condition, Modification } from '@lightningkite/lightning-server-simplified';

const condition: Condition<User> = {
  name: { Equal: 'John' }
};

const modification: Modification<User> = {
  name: { Assign: 'Jane' }
};
```

## API Overview

- **apiCall**: Low-level API call utility with support for JSON and file uploads.
- **RestEndpoint**: Interface for RESTful CRUD operations.
- **Condition**: Type for building query conditions.
- **Modification**: Type for building update modifications.
- **Fetching utilities**: Basic and bulk fetchers for data retrieval.
- **Mock endpoints**: Tools for mocking REST endpoints in tests.

## Building

```bash
npm run build
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Testing

```bash
npm test
```

Runs the Jest test suite with coverage.

## Contributing

This project is part of the [Lightning Server](https://github.com/lightningkite/lightning-server) repository. Please see the main repository for contribution guidelines.

## License

MIT