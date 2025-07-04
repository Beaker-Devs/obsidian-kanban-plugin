import { ItemView, TFile, WorkspaceLeaf, parseYaml, Events } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { KanbanBoard } from "../components/KanbanBoard";
import { GenericTableDemo } from "../components/GenericTable";
import type { Task as BaseTask } from "../components/TaskCard";

interface KanbanTask extends BaseTask {
	ctime: number;
	order: number;
}

export const KANBAN_VIEW_TYPE = "kanban-board-view";
export const kanbanEvents = new Events();

export class KanbanView extends ItemView {
	reactRoot: ReactDOM.Root | null = null;
	private lastTaskState: Record<string, any[]> | null = null;
	private currentTimeFilter: string = 'all';
	private static FILTER_KEY = 'kanban-time-filter';
	private selectedNav: string = 'Expenses';
	private setSelectedNav: (item: string) => void = (item) => {
		this.selectedNav = item;
		this.loadTasksAndRender();
	};

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// Load persisted filter from localStorage
		const saved = localStorage.getItem(KanbanView.FILTER_KEY);
		if (saved) {
			this.currentTimeFilter = saved;
		}
	}

	getViewType(): string {
		return KANBAN_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Boards";
	}

	getIcon(): string {
		return "layout";
	}

	onOpenTask = (path: string) => {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;

		const leaf = this.app.workspace.getLeaf(true);
		if (!leaf) return;

		leaf.openFile(file, { active: true });
	};

	async onOpen() {
		kanbanEvents.on("refresh", this.handleRefresh);
		await this.loadTasksAndRender();
	}

	async onClose() {
		kanbanEvents.off("refresh", this.handleRefresh);
		if (this.reactRoot) {
			this.reactRoot.unmount();
			this.reactRoot = null;
		}
		return Promise.resolve();
	}

	handleRefresh = () => {
		this.loadTasksAndRender();
	};

	handleTimeFilterChange = (filter: string) => {
		this.currentTimeFilter = filter;
		localStorage.setItem(KanbanView.FILTER_KEY, filter);
		this.loadTasksAndRender();
	};

	getTimeFilterDisplayName(): string {
		switch (this.currentTimeFilter) {
			case 'today':
				return 'Today';
			case 'week':
				return 'This Week';
			default:
				return 'All Tasks';
		}
	}

	private isTaskInTimeRange(task: any): boolean {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const due = task.due_date ? new Date(task.due_date) : (task.due ? new Date(task.due) : null);
		const started = task.started_at ? new Date(task.started_at) : null;
		const completed = task.status === 'done' ? new Date(task.due_date) : null;
		const ctime = task.ctime ? new Date(task.ctime * 1000) : null;

		const isToday = (d: any) => d instanceof Date && d >= today && d < tomorrow;

		switch (this.currentTimeFilter) {
			case 'today': {
				// Show tasks due today or overdue (same logic as Dataview)
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const todayMillis = today.getTime();
				return due !== null && due.getTime() <= todayMillis;
			}
			case 'week': {
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				weekStart.setHours(0, 0, 0, 0);
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);
				weekEnd.setHours(23, 59, 59, 999);
				const datesToCheck = [due, started, completed, ctime].filter((date): date is Date => date !== null && !isNaN(date.getTime()));
				return datesToCheck.some(date => date >= weekStart && date <= weekEnd);
			}
			default:
				return true; // 'all' - show all tasks
		}
	}

	async loadTasksAndRender() {
		const container = this.containerEl.children[1];
		container.empty();

		// Sidebar nav items
		const NAV_ITEMS = [
			'People', 'Companies', 'Opportunities', 'Tasks', 'Notes', 'Invoices', 'Bill Payments', 'Expenses', 'Workflows'
		];

		// Only load tasks if not on Expenses
		let taskState: Record<string, any[]> = {
			Backlog: [],
			"To Do": [],
			"In Progress": [],
			Done: [],
		};
		if (this.selectedNav !== 'Expenses') {
			const files = this.app.vault.getMarkdownFiles();
			const tasksWithMeta: KanbanTask[] = [];
			for (const file of files) {
				const content = await this.app.vault.read(file);
				const frontmatter = this.extractFrontmatter(content);
				const tags = frontmatter?.tags;
				if (
					!Array.isArray(tags) ||
					!tags.some(
						(tag) =>
							typeof tag === "string" &&
							tag.toLowerCase().includes("task")
					)
				) {
					continue;
				}
				const status = (frontmatter?.status || "").toLowerCase();
				const task = {
					title: file.basename,
					path: file.path,
					ctime: (file as TFile).stat.ctime,
					status,
					order: frontmatter?.order || 0,
					...frontmatter,
				};
				tasksWithMeta.push(task);
			}
			taskState = {
				Backlog: [],
				"To Do": [],
				"In Progress": [],
				Done: [],
			};
			tasksWithMeta.forEach((task) => {
				if (task.status === "backlog") taskState["Backlog"].push(task);
				else if (task.status === "doing") taskState["In Progress"].push(task);
				else if (task.status === "done") taskState["Done"].push(task);
				else taskState["To Do"].push(task);
			});
			// ... time filter and sorting as before ...
			if (this.currentTimeFilter !== 'all') {
				for (const columnName of Object.keys(taskState)) {
					taskState[columnName] = taskState[columnName].filter(task => this.isTaskInTimeRange(task));
				}
			}
			for (const col of Object.keys(taskState)) {
				taskState[col].sort((a, b) => {
					if (a.order !== b.order) {
						return a.order - b.order;
					}
					return b.ctime - a.ctime;
				});
			}
			this.lastTaskState = taskState;
		}

		this.renderWithCurrentState(taskState);
	}

	private renderWithCurrentState(taskState: Record<string, any[]>) {
		const container = this.containerEl.children[1];
		container.empty();

		// Sidebar nav items
		const NAV_ITEMS = [
			'People', 'Companies', 'Opportunities', 'Tasks', 'Notes', 'Invoices', 'Bill Payments', 'Expenses', 'Workflows'
		];

		// Render with React
		const reactContainer = container.createDiv();
		this.reactRoot = ReactDOM.createRoot(reactContainer);
		this.reactRoot.render(
			React.createElement(
				'div',
				{ className: 'kanban-layout' },
				React.createElement(
					'div',
					{ className: 'kanban-sidebar' },
					React.createElement('div', { className: 'sidebar-header-app' }, 'Beaker'),
					React.createElement(
						'ul',
						{ className: 'sidebar-nav' },
						NAV_ITEMS.map(item =>
							React.createElement(
								'li',
								{
									key: item,
									className: `sidebar-nav-item${item === this.selectedNav ? ' active' : ''}`,
									onClick: () => {
										this.selectedNav = item;
										this.loadTasksAndRender();
									}
								},
								item
							)
						)
					)
				),
				React.createElement(
					'div',
					{ className: 'kanban-main-content' },
					this.selectedNav === 'Expenses'
						? React.createElement(GenericTableDemo, {})
						: React.createElement(KanbanBoard, {
							tasks: taskState,
							onOpenTask: this.onOpenTask,
							onAddTask: (status: string) => this.createNewTask(status),
							onTaskMove: (
								taskPath: string,
								newStatus: string,
								newIndex?: number
							) => this.moveTask(taskPath, newStatus, newIndex),
							onTimeFilterChange: this.handleTimeFilterChange,
							currentTimeFilter: this.currentTimeFilter,
							timeFilterDisplayName: this.getTimeFilterDisplayName(),
						})
				)
			)
		);
	}

	private async moveTask(
		taskPath: string,
		newStatus: string,
		newIndex?: number
	) {
		const file = this.app.vault.getAbstractFileByPath(taskPath);
		if (!(file instanceof TFile)) return;

		const content = await this.app.vault.read(file);
		const frontmatter = this.extractFrontmatter(content);

		if (!frontmatter) return;

		frontmatter.status = newStatus;

		if (newIndex !== undefined) {
			const targetTasks = [];
			for (const f of this.app.vault.getMarkdownFiles()) {
				const fContent = await this.app.vault.read(f);
				const fFrontmatter = this.extractFrontmatter(fContent);
				if (
					fFrontmatter?.tags?.some((tag: string) =>
						tag.toLowerCase().includes("task")
					) &&
					fFrontmatter.status === newStatus
				) {
					targetTasks.push({
						path: f.path,
						order: fFrontmatter.order || 0,
						ctime: (f as TFile).stat.ctime,
					});
				}
			}

			targetTasks.sort((a, b) => {
				if (a.order !== b.order) {
					return a.order - b.order;
				}
				return b.ctime - a.ctime;
			});

			if (newIndex === 0) {
				frontmatter.order =
					targetTasks.length > 0 ? targetTasks[0].order - 1000 : 0;
			} else if (newIndex >= targetTasks.length) {
				frontmatter.order =
					targetTasks.length > 0
						? targetTasks[targetTasks.length - 1].order + 1000
						: 0;
			} else {
				const prevTask = targetTasks[newIndex - 1];
				const nextTask = targetTasks[newIndex];
				frontmatter.order =
					prevTask.order + (nextTask.order - prevTask.order) / 2;
			}
		}

		const updatedContent = this.updateFrontmatter(content, frontmatter);

		// Update the file first
		await this.app.vault.modify(file, updatedContent);
		
		// Immediately update local state to prevent flashing
		if (this.lastTaskState) {
			// Find the task in the current state and update it
			for (const columnName of Object.keys(this.lastTaskState)) {
				const taskIndex = this.lastTaskState[columnName].findIndex(task => task.path === taskPath);
				if (taskIndex !== -1) {
					const task = this.lastTaskState[columnName][taskIndex];
					// Remove from current column
					this.lastTaskState[columnName].splice(taskIndex, 1);
					
					// Update task properties
					task.status = newStatus;
					if (frontmatter.order !== undefined) {
						task.order = frontmatter.order;
					}
					
					// Add to new column
					let targetColumn = "To Do";
					if (newStatus === "backlog") targetColumn = "Backlog";
					else if (newStatus === "doing") targetColumn = "In Progress";
					else if (newStatus === "done") targetColumn = "Done";
					
					this.lastTaskState[targetColumn].push(task);
					
					// Re-sort the target column
					this.lastTaskState[targetColumn].sort((a, b) => {
						if (a.order !== b.order) {
							return a.order - b.order;
						}
						return b.ctime - a.ctime;
					});
					
					break;
				}
			}
			
			// Re-render with updated state
			this.renderWithCurrentState(this.lastTaskState);
		}
	}

	private updateFrontmatter(
		content: string,
		newFrontmatter: Record<string, any>
	): string {
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (!frontmatterMatch) return content;

		const yamlContent = Object.entries(newFrontmatter)
			.map(([key, value]) => {
				if (Array.isArray(value)) {
					return `${key}: [${value.join(", ")}]`;
				}
				return `${key}: ${value}`;
			})
			.join("\n");

		const newFrontmatterBlock = `---\n${yamlContent}\n---`;
		return content.replace(/^---\n[\s\S]*?\n---/, newFrontmatterBlock);
	}

	private async createNewTask(status: string = "todo") {
		const now = new Date();
		const pad = (n: number) => n.toString().padStart(2, "0");
		const y = now.getFullYear();
		const m = pad(now.getMonth() + 1);
		const d = pad(now.getDate());
		const h = pad(now.getHours());
		const min = pad(now.getMinutes());
		const s = pad(now.getSeconds());
		const fileName = `Task ${y}-${m}-${d} ${h}${min}${s}.md`;

		const frontmatter = [
			"---",
			"tags: [task]",
			`status: ${status}`,
			"assignee: ",
			"priority: low",
			"estimate_hours: ",
			"due: ",
			"started_at: ",
			"completed_at: ",
			"project: ",
			"---",
			"",
			"# New Task",
			"",
			"Describe the task here.",
		].join("\n");

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
			console.warn("Invalid frontmatter:", e);
			return null;
		}
	}

	public refresh() {
		this.onOpen();
	}
}
