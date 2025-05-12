# Admin Panel Refactoring Guide

This documentation outlines the plan for refactoring the Admin Panel to make it more modular, maintainable, and easier to extend.

## Current Structure

Currently, the entire Admin Panel is contained in a single `ManagementPage.tsx` file that is over 3600 lines long. This makes it difficult to maintain and extend.

## New Structure

We are refactoring the Admin Panel into a more modular architecture:

```
frontend/src/pages/Admin/
├── ManagementPage.tsx             # Main container component (refactored)
├── README.md                      # This documentation
└── ResourceManagers/              # Directory for resource managers
    ├── index.tsx                  # Exports and factory function
    ├── types.ts                   # Shared types and interfaces
    ├── UserManager.tsx            # User-specific management
    ├── DoctorManager.tsx          # Doctor-specific management
    ├── ProfileManager.tsx         # Profile-specific management
    ├── PaymentManager.tsx         # (To be implemented)
    ├── ConsultationManager.tsx    # (To be implemented)
    ├── AppointmentManager.tsx     # (To be implemented)
    └── ScanManager.tsx            # (To be implemented)
```

## Refactoring Process

1. **Create Resource Manager Components**: Each resource type gets its own component handling its specific form and operations.

2. **Define Shared Types**: Common interfaces and types are defined in `types.ts`.

3. **Create Factory Function**: The `index.tsx` file exports a factory function that returns the appropriate manager component based on the resource type.

4. **Update Main Component**: Modify `ManagementPage.tsx` to use the new manager components.

## How to Add a New Resource Manager

1. Create a new file in the `ResourceManagers` directory (e.g., `PaymentManager.tsx`).

2. Implement the component following the pattern established in other managers.

3. Update `types.ts` with any new interfaces or types needed.

4. Add the new manager to the factory function in `index.tsx`.

## Manager Component Interface

Each manager component should implement the following interface:

```typescript
interface ResourceManagerProps<T extends ApiResource> {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: T | null;
  onSave: (formData: FormData) => Promise<void>;
  isAddMode: boolean;
}
```

## Usage

To use a resource manager directly:

```tsx
import { UserManager } from './ResourceManagers';

// ...

<UserManager
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  selectedItem={selectedUser}
  onSave={handleSave}
  isAddMode={false}
/>
```

Or use the generic ResourceManager:

```tsx
import ResourceManager from './ResourceManagers';

// ...

<ResourceManager
  resource="users"
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  selectedItem={selectedItem}
  onSave={handleSave}
  isAddMode={false}
/>
``` 