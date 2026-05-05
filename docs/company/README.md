# Company Personas

User personas for a 200+ FTE company running Primer. One persona per distinct role in the system — not one per employee.

Each persona maps to:

- A **company position** (where they sit in the org)
- A **system role** (`org_role` in the database)
- A **node type** (`node_type` in the hierarchy)

## Personas

| File                                   | Name            | Company Title             | System Role    | Node Type                        |
| -------------------------------------- | --------------- | ------------------------- | -------------- | -------------------------------- |
| [ceo.md](ceo.md)                       | Marcus Chen     | CEO                       | `owner`        | `executive_leader`               |
| [vp.md](vp.md)                         | Sarah Okonkwo   | VP of Operations          | `editor`       | `executive_leader`               |
| [director.md](director.md)             | James Whitfield | Director of Engineering   | `editor`       | `department`                     |
| [manager.md](manager.md)               | Priya Nair      | Engineering Manager       | `editor`       | `team`                           |
| [ic.md](ic.md)                         | Derek Solís     | Senior Software Engineer  | `participant`  | `individual`                     |
| [new-hire.md](new-hire.md)             | Aisha Torres    | Associate Product Manager | `participant`  | `individual` (pending placement) |
| [hr.md](hr.md)                         | Linda Reyes     | HR Director               | `hr_admin`     | `individual`                     |
| [chief-of-staff.md](chief-of-staff.md) | Carlos Mendez   | Chief of Staff            | `system_admin` | `individual`                     |

## Role Hierarchy in a 200+ FTE Company

```
CEO (owner)
├── VP of Operations (editor / executive_leader)
│   ├── Director of Engineering (editor / department)
│   │   ├── Engineering Manager (editor / team)
│   │   │   ├── Senior Software Engineer (participant / individual)
│   │   │   └── New Hire — Associate PM (participant / individual, unplaced)
│   │   └── ...
│   └── ...
├── Chief of Staff (system_admin / individual) ← org-wide ops, not in hierarchy above anyone
└── HR Director (hr_admin / individual) ← org-wide people ops, not in hierarchy above anyone
```

## Notes

- `system_admin` and `hr_admin` roles are not positions in the management chain — they are delegated operational roles granted by the CEO (owner). Neither appears above others in the hierarchy.
- A new hire exists in the system before being placed in the hierarchy. Until resolved by `hr_admin` or `owner`, they have a pending `placement_request`.
- The `editor` role covers the VP → Director → Manager band. What differs is hierarchy depth, not system role.
