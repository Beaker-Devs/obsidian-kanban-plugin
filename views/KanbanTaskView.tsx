import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

export const KANBAN_TASK_VIEW = 'kanban-task-view';

export class KanbanTaskView extends ItemView {
  reactRoot: ReactDOM.Root | null = null;
  task: any = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() { return KANBAN_TASK_VIEW; }
  getDisplayText() { return 'Task Details'; }

  setTask(task: any) {
    this.task = task;
    if (this.reactRoot) {
      this.reactRoot.render(<TaskDetails task={task} />);
    }
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    this.reactRoot = ReactDOM.createRoot(container.createDiv());
    if (this.task) {
      this.reactRoot.render(<TaskDetails task={this.task} />);
    }
  }

  async onClose() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }
}

const TaskDetails: React.FC<{ task: any }> = ({ task }) => {
  if (!task) return <div>No task selected.</div>;
  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>{task.title}</h2>
      <pre style={{ background: '#222', color: '#eee', padding: '1rem', borderRadius: '8px' }}>
        {JSON.stringify(task, null, 2)}
      </pre>
    </div>
  );
}; 