import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

export interface Task {
  path: string;
  title: string;
  status: string;
  priority?: string;
  project?: string;
  estimate_hours?: number;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  author?: string;
}

export interface TaskCardProps {
  task: Task;
  columnStatus: string;
  onOpenTask: (path: string) => void;
  onTaskMove?: (taskPath: string, newStatus: string, newIndex?: number) => void;
}

const ICON_SVGS = {
  project: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"/><path d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8z"/></svg>',
  priority: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>',
  estimate: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
  due: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  started: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,4 15,12 5,20 5,4"/></svg>',
  done: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
  author: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  default: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>'
} as const;

const getIconSvg = (icon: keyof typeof ICON_SVGS): string => {
  return ICON_SVGS[icon] || ICON_SVGS.default;
};

const TaskPriorityIndicator: React.FC<{ priority?: string; isDone: boolean }> = ({ 
  priority, 
  isDone 
}) => {
  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '0.7em',
    height: '0.7em',
    minWidth: '0.7em',
    minHeight: '0.7em',
    maxWidth: '0.7em',
    maxHeight: '0.7em',
    borderRadius: '50%',
    marginRight: '0.5em',
    verticalAlign: 'middle',
    background: isDone ? '#006a00' : undefined,
    flexShrink: 0,
  };

  if (isDone) {
    return <span style={dotStyle} />;
  }

  if (!priority) return null;

  return <span className={`priority-dot priority-${String(priority).toLowerCase()}`} style={dotStyle} />;
};

const TaskTitle: React.FC<{ title: string; isDone: boolean }> = ({ title, isDone }) => {
  return (
    <span
      className={isDone ? "kanban-task-title-done" : undefined}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        maxHeight: '2.8em',
      }}
    >
      {title}
    </span>
  );
};

const TaskMetaPill: React.FC<{ 
  icon: keyof typeof ICON_SVGS; 
  text: string; 
  className: string 
}> = ({ icon, text, className }) => (
  <span 
    className={`task-pill ${className}`} 
    dangerouslySetInnerHTML={{ __html: `${getIconSvg(icon)} ${text}` }} 
  />
);

const TaskMeta: React.FC<{ task: Task }> = ({ task }) => (
  <div className="task-meta">
    {task.project && (
      <TaskMetaPill icon="project" text={task.project} className="project" />
    )}
    {task.estimate_hours != null && (
      <TaskMetaPill icon="estimate" text={`${task.estimate_hours}h`} className="estimate" />
    )}
    {task.due_date && (
      <TaskMetaPill icon="due" text={task.due_date} className="due" />
    )}
    {task.started_at && (
      <TaskMetaPill icon="started" text={task.started_at} className="started" />
    )}
    {task.completed_at && (
      <TaskMetaPill icon="done" text={task.completed_at} className="done" />
    )}
    {task.author && (
      <TaskMetaPill icon="author" text={task.author} className="author" />
    )}
  </div>
);

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  columnStatus, 
  onOpenTask, 
  onTaskMove 
}) => {
  const taskRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDone = columnStatus === 'done';

  useEffect(() => {
    const element = taskRef.current;
    if (!element) return;

    const cleanup = draggable({
      element,
      getInitialData: () => ({
        type: 'TASK',
        taskPath: task.path,
        taskStatus: task.status,
        taskTitle: task.title,
      }),
      onGenerateDragPreview: () => {
        setIsDragging(true);
      },
      onDrop: () => {
        setIsDragging(false);
      },
      onDragStart: () => {
        setIsDragging(true);
      },
    });

    return cleanup;
  }, [task.path, task.status, task.title]);

  const handleClick = () => {
    onOpenTask(task.path);
  };

  return (
    <div
      ref={taskRef}
      className={`kanban-task ${isDragging ? 'dragging' : ''} is-clickable`}
      onClick={handleClick}
      style={{ cursor: 'grab' }}
      draggable={false}
    >
      <div className="task-header">
        <TaskPriorityIndicator priority={task.priority} isDone={isDone} />
        <TaskTitle title={task.title} isDone={isDone} />
      </div>
      <TaskMeta task={task} />
    </div>
  );
}; 