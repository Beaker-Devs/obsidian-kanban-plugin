# Time Filter Test Documentation

## Overview
The Kanban board now includes a time filter dropdown in the top right corner with three options:
- **All Tasks**: Shows all tasks regardless of date
- **Today**: Shows tasks created, due, started, or completed today
- **This Week**: Shows tasks created, due, started, or completed this week

## How It Works

### Date Fields Checked
The filter checks multiple date fields from task frontmatter:
- `ctime`: File creation time
- `due`: Due date
- `started_at`: When the task was started
- `completed_at`: When the task was completed

### Filtering Logic
- **Today**: Matches any task with any date field matching today's date
- **This Week**: Matches any task with any date field falling within the current week (Sunday to Saturday)
- **All Tasks**: Shows all tasks regardless of dates

### Example Task Frontmatter
```yaml
---
tags: [task]
status: todo
due: 2024-01-15
started_at: 2024-01-10
completed_at: 
project: My Project
---
```

## Testing the Feature

1. Open the Kanban board view
2. Look for the dropdown in the top right corner
3. Select different time filters to see tasks filtered accordingly
4. The board title will update to show the current filter (e.g., "Kanban Board - Today")

## Implementation Details

- The filter is applied in real-time when changed
- Tasks without valid dates are included in all filters
- The filter considers multiple date fields for comprehensive filtering
- The UI updates immediately when the filter is changed 