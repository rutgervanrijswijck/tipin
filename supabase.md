## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `role` | `text` |  Nullable |
| `id` | `uuid` | Primary |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `status` | `text` | Nullable |

## Table `events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `reason_required_out` | `bool` |  Nullable |
| `reason_required_maybe` | `bool` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `event_type` | `text` |  |
| `start_time` | `timestamptz` |  |
| `location` | `text` |  Nullable |
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  Nullable |

## Table `attendance`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `reason` | `text` |  Nullable |
| `user_id` | `uuid` |  |
| `event_id` | `uuid` |  |
| `status` | `text` |  |
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  Nullable |

## Table `polls`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `question` | `text` |  |
| `options` | `jsonb` |  |
| `created_by` | `uuid` |  Nullable |
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  Nullable |
| `max_choices` | `int4` | Nullable |
| `relevant_date` | `timestamptz` | Nullable |

## Table `poll_votes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `poll_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `option_index` | `int4` |  |

