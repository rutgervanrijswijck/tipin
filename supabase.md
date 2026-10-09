## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `status` | `text` |  Nullable |
| `joined_at` | `timestamptz` |  Nullable |
| `role` | `text` |  Nullable |
| `id` | `uuid` | Primary |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |

## Table `events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `answer_by` | `timestamptz` |  Nullable |
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
| `max_choices` | `int4` |  Nullable |
| `relevant_date` | `timestamptz` |  Nullable |
| `answer_by` | `timestamptz` |  Nullable |
| `question` | `text` |  |
| `options` | `jsonb` |  |
| `created_by` | `uuid` |  Nullable |
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  Nullable |

## Table `poll_votes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `poll_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `option_index` | `int4` |  |

## Table `boete_types`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `name` | `text` |  |
| `id` | `uuid` | Primary |
| `default_amount` | `numeric` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `boetes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` |  |
| `boete_type_id` | `uuid` |  |
| `event_id` | `uuid` |  Nullable |
| `amount` | `numeric` |  |
| `reason` | `text` |  Nullable |
| `id` | `uuid` | Primary |
| `issued_at` | `timestamptz` |  Nullable |
| `status` | `text` |  Nullable |

## Table `adts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` |  |
| `time_seconds` | `numeric` |  |
| `id` | `uuid` | Primary |
| `recorded_at` | `timestamptz` |  Nullable |

## Table `carpools`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `event_id` | `uuid` |  |
| `driver_id` | `uuid` |  |
| `id` | `uuid` | Primary |
| `max_passengers` | `int4` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `carpool_passengers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `carpool_id` | `uuid` |  |
| `passenger_id` | `uuid` |  |
| `id` | `uuid` | Primary |
| `joined_at` | `timestamptz` |  Nullable |

