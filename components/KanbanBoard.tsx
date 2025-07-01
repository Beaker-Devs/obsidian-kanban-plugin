import * as React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Task } from './TaskCard';

export interface KanbanBoardProps {
  tasks: Record<string, Task[]>;
  onOpenTask: (path: string) => void;
  onAddTask: (status: string) => void;
  onTaskMove?: (taskPath: string, newStatus: string, newIndex?: number) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onOpenTask, 
  onAddTask, 
  onTaskMove 
}) => {
  const columns = [
    { title: 'Backlog', status: 'backlog' },
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'doing' },
    { title: 'Done', status: 'done' },
  ];

  return (
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
  );
}; 