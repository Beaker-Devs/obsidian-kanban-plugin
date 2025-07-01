import * as React from 'react';

export interface KanbanBoardProps {
  tasks: Record<string, any[]>;
  onOpenTask: (path: string) => void;
  onAddTask: (status: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onOpenTask, onAddTask }) => {
  function getIconSvg(icon: string): string {
    switch (icon) {
      case 'project': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"/><path d="M8 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8z"/></svg>';
      case 'priority': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>';
      case 'estimate': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>';
      case 'due': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      case 'started': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,4 15,12 5,20 5,4"/></svg>';
      case 'done': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>';
      case 'author': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      default: return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>';
    }
  }

  const columns = [
    { title: 'Backlog', status: 'backlog' },
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'doing' },
    { title: 'Done', status: 'done' },
  ];

  return (
    <div className="kanban-board">
      {columns.map(col => (
        <div className="kanban-column" key={col.title}>
          <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{col.title}</span>
            <button
              className="kanban-add-task-btn"
              title="Add Task"
              onClick={() => onAddTask(col.status)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </h3>
          <div className="kanban-tasks">
            {(tasks[col.title] || []).map(task => (
              <div className="kanban-task is-clickable" key={task.path} onClick={() => onOpenTask(task.path)}>
                <div className="task-header">
                  {col.status === 'done' ? (
                    <span style={{ display: 'inline-block', width: '0.7em', height: '0.7em', borderRadius: '50%', marginRight: '0.5em', background: '#006a00', verticalAlign: 'middle' }}></span>
                  ) : (
                    task.priority && (
                      <span className={`priority-dot priority-${String(task.priority).toLowerCase()}`}></span>
                    )
                  )}
                  {col.status === 'done' ? (
                    <span className="kanban-task-title-done">{task.title}</span>
                  ) : (
                    task.title
                  )}
                </div>
                <div className="task-meta">
                  {task.project && (
                    <span className="task-pill project" dangerouslySetInnerHTML={{ __html: getIconSvg('project') + ' ' + task.project }} />
                  )}
                  {task.estimate_hours != null && (
                    <span className="task-pill estimate" dangerouslySetInnerHTML={{ __html: getIconSvg('estimate') + ' ' + `${task.estimate_hours}h` }} />
                  )}
                  {task.due && (
                    <span className="task-pill due" dangerouslySetInnerHTML={{ __html: getIconSvg('due') + ' ' + task.due }} />
                  )}
                  {task.started_at && (
                    <span className="task-pill started" dangerouslySetInnerHTML={{ __html: getIconSvg('started') + ' ' + task.started_at }} />
                  )}
                  {task.completed_at && (
                    <span className="task-pill done" dangerouslySetInnerHTML={{ __html: getIconSvg('done') + ' ' + task.completed_at }} />
                  )}
                  {task.author && (
                    <span className="task-pill author" dangerouslySetInnerHTML={{ __html: getIconSvg('author') + ' ' + task.author }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 