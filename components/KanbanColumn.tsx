import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { TaskCard, Task } from './TaskCard';

export interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: Task[];
  onOpenTask: (path: string) => void;
  onAddTask: (status: string) => void;
  onTaskMove?: (taskPath: string, newStatus: string, newIndex?: number) => void;
}

interface DropIndicatorState {
  y: number;
  visible: boolean;
  edge: 'top' | 'bottom';
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  status, 
  tasks, 
  onOpenTask, 
  onAddTask, 
  onTaskMove 
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState>({ 
    y: 0, 
    visible: false, 
    edge: 'top' 
  });

  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingOver) {
        const rect = element.getBoundingClientRect();
        const mouseY = e.clientY;
        
        const taskElements = element.querySelectorAll('.kanban-task');
        let indicatorY = 0; 
        
        if (taskElements.length === 0) {
          indicatorY = 8;
        } else {
          for (let i = 0; i < taskElements.length; i++) {
            const taskRect = taskElements[i].getBoundingClientRect();
            const taskCenter = taskRect.top + taskRect.height / 2;
            
            if (mouseY < taskCenter) {
              indicatorY = taskRect.top - rect.top - 2; 
              break;
            }
            
            if (i === taskElements.length - 1) {
              indicatorY = taskRect.bottom - rect.top + 2;
            }
          }
        }
        
        console.log('Drop indicator:', { y: indicatorY, visible: true, mouseY, rectTop: rect.top });
        setDropIndicator({ y: indicatorY, visible: true, edge: 'top' });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ type: 'COLUMN', columnTitle: title, columnStatus: status }),
        onDragEnter: () => {
          setIsDraggingOver(true);
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
          setDropIndicator({ y: 0, visible: false, edge: 'top' });
        },
        onDrop: (payload) => {
          setIsDraggingOver(false);
          setDropIndicator({ y: 0, visible: false, edge: 'top' });
          
          const draggedData = payload.source.data as any;
          if (draggedData?.type === 'TASK' && onTaskMove) {
            const taskPath = draggedData.taskPath as string;
            const newStatus = status;
            
            const rect = element.getBoundingClientRect();
            const dropY = payload.location.current.input.clientY;
            const relativeY = dropY - rect.top;
            
            const taskElements = element.querySelectorAll('.kanban-task');
            let newIndex = tasks.length; 
            
            for (let i = 0; i < taskElements.length; i++) {
              const taskRect = taskElements[i].getBoundingClientRect();
              if (dropY < taskRect.top + taskRect.height / 2) {
                newIndex = i;
                break;
              }
            }
            
            onTaskMove(taskPath, newStatus, newIndex);
          }
        },
      }),
      autoScrollForElements({
        element,
      }),
      () => {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    );
  }, [title, status, tasks, onTaskMove, isDraggingOver]);

  const handleAddTask = () => {
    onAddTask(status);
  };

  return (
    <div 
      ref={columnRef}
      className={`kanban-column ${isDraggingOver ? 'dragging-over' : ''}`}
      style={{ position: 'relative' }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <button
          className="kanban-add-task-btn"
          title="Add Task"
          onClick={handleAddTask}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </h3>
      <div className="kanban-tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.path}
            task={task}
            columnStatus={status}
            onOpenTask={onOpenTask}
            onTaskMove={onTaskMove}
          />
        ))}
      </div>
      {/* Drop indicator outside the tasks container */}
      <div 
        className="drop-indicator"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 50,
          height: '5px',
          backgroundColor: 'red',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      />
      {dropIndicator.visible && (
        <div 
          className="drop-indicator"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: dropIndicator.y,
            height: '3px',
            backgroundColor: '#3b82f6',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}; 