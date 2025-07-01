import { ItemView, TFile, WorkspaceLeaf, parseYaml, Events } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { KanbanBoard } from '../components/KanbanBoard';

export const KANBAN_VIEW_TYPE = 'kanban-board-view';
export const kanbanEvents = new Events();

export class KanbanView extends ItemView {
	reactRoot: ReactDOM.Root | null = null;
	private lastTaskState: Record<string, any[]> | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return KANBAN_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Kanban Board';
	}

	getIcon(): string {
		return 'layout';
	}

	onOpenTask = (path: string) => {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;

		const leaf = this.app.workspace.getLeaf(true);
		if (!leaf) return;

		leaf.openFile(file, { active: true });
	};

	async onOpen() {
		kanbanEvents.on('refresh', this.handleRefresh);
		await this.loadTasksAndRender();
	}

	async onClose() {
		kanbanEvents.off('refresh', this.handleRefresh);
		if (this.reactRoot) {
			this.reactRoot.unmount();
			this.reactRoot = null;
		}
		return Promise.resolve();
	}

	handleRefresh = () => {
		this.loadTasksAndRender();
	};

	async loadTasksAndRender() {
		const container = this.containerEl.children[1];
		container.empty();

		const files = this.app.vault.getMarkdownFiles();
		const tasksWithMeta = [];
		for (const file of files) {
			const content = await this.app.vault.read(file);
			const frontmatter = this.extractFrontmatter(content);
			const tags = frontmatter?.tags;
			if (!Array.isArray(tags) || !tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes('task'))) {
				continue;
			}
			const status = (frontmatter?.status || '').toLowerCase();
			tasksWithMeta.push({
				title: file.basename,
				path: file.path,
				ctime: (file as TFile).stat.ctime,
				status,
				...frontmatter
			});
		}
		const taskState: Record<string, any[]> = {
			'Backlog': [],
			'To Do': [],
			'In Progress': [],
			'Done': [],
		};

		tasksWithMeta.forEach(task => {
			if (task.status === 'backlog') taskState['Backlog'].push(task);
			else if (task.status === 'doing') taskState['In Progress'].push(task);
			else if (task.status === 'done') taskState['Done'].push(task);
			else taskState['To Do'].push(task);
		});

		for (const col of Object.keys(taskState)) {
			taskState[col].sort((a, b) => b.ctime - a.ctime);
		}

		this.lastTaskState = taskState;

		const reactContainer = container.createDiv();
		this.reactRoot = ReactDOM.createRoot(reactContainer);
		this.reactRoot.render(
			React.createElement(KanbanBoard, {
				tasks: taskState,
				onOpenTask: this.onOpenTask,
				onAddTask: (status: string) => this.createNewTask(status)
			})
		);
	}

	private async createNewTask(status: string = 'todo') {
		const now = new Date();
		const pad = (n: number) => n.toString().padStart(2, '0');
		const y = now.getFullYear();
		const m = pad(now.getMonth() + 1);
		const d = pad(now.getDate());
		const h = pad(now.getHours());
		const min = pad(now.getMinutes());
		const s = pad(now.getSeconds());
		const fileName = `Task ${y}-${m}-${d} ${h}${min}${s}.md`;

		const frontmatter = [
			'---',
			'tags: [task]',
			`status: ${status}`,
			'assignee: ',
			'priority: low',
			'estimate_hours: ',
			'due: ',
			'started_at: ',
			'completed_at: ',
			'project: ',
			'---',
			'',
			'# New Task',
			'',
			'Describe the task here.',
		].join('\n');

		const file = await this.app.vault.create(fileName, frontmatter);
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.openFile(file, { active: true });
	}



	extractFrontmatter(content: string): Record<string, any> | null {
		const match = content.match(/^---\n([\s\S]*?)\n---/);
		if (!match) return null;
		try {
			return parseYaml(match[1]) || {};
		} catch (e) {
			console.warn('Invalid frontmatter:', e);
			return null;
		}
	}

	public refresh() {
		this.onOpen();
	}
} 