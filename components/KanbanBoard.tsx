import * as React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Task } from './TaskCard';
import { ChevronDown } from 'lucide';

export interface KanbanBoardProps {
  tasks: Record<string, Task[]>;
  onOpenTask: (path: string) => void;
  onAddTask: (status: string) => void;
  onTaskMove?: (taskPath: string, newStatus: string, newIndex?: number) => void;
  onTimeFilterChange?: (filter: string) => void;
  currentTimeFilter?: string;
  timeFilterDisplayName?: string;
}

const TIME_FILTERS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onOpenTask, 
  onAddTask, 
  onTaskMove,
  onTimeFilterChange,
  currentTimeFilter = 'all',
  timeFilterDisplayName = 'All Tasks'
}) => {
  const columns = [
    { title: 'Backlog', status: 'backlog' },
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'doing' },
    { title: 'Done', status: 'done' },
  ];

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleTimeFilterChange = (value: string) => {
    setDropdownOpen(false);
    if (onTimeFilterChange) {
      onTimeFilterChange(value);
    }
  };

  const currentLabel = TIME_FILTERS.find(f => f.value === currentTimeFilter)?.label || 'All Tasks';

  return (
    <div className="kanban-board-container">
      <div className="kanban-board-header">
        <div className="kanban-board-title">
        </div>
        <div className="kanban-board-controls">
          <div className="kanban-time-filter-dropdown" ref={dropdownRef}>
            <button
              className="kanban-time-filter-btn"
              onClick={() => setDropdownOpen(v => !v)}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span>{currentLabel}</span>
              <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </span>
            </button>
            {dropdownOpen && (
              <ul className="kanban-time-filter-list" role="listbox">
                {TIME_FILTERS.map(opt => (
                  <li
                    key={opt.value}
                    className={`kanban-time-filter-option${opt.value === currentTimeFilter ? ' selected' : ''}`}
                    role="option"
                    aria-selected={opt.value === currentTimeFilter}
                    onClick={() => handleTimeFilterChange(opt.value)}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="kanban-board">
        {columns.map(col => (
          <KanbanColumn
            key={col.title}
            title={col.title}
            status={col.status}
            tasks={tasks[col.title] || []}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
            onTaskMove={onTaskMove}
          />
        ))}
      </div>
    </div>
  );
}; 