import { ItemView, TFile, WorkspaceLeaf, parseYaml, Events } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { KanbanBoard } from "../components/KanbanBoard";

export const KANBAN_VIEW_TYPE = "kanban-board-view";
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
		return "Kanban Board";
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

	async loadTasksAndRender() {
		const container = this.containerEl.children[1];
		container.empty();

		const files = this.app.vault.getMarkdownFiles();
		const tasksWithMeta = [];
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
			tasksWithMeta.push({
				title: file.basename,
				path: file.path,
				ctime: (file as TFile).stat.ctime,
				status,
				order: frontmatter?.order || 0,
				...frontmatter,
			});
		}
		const taskState: Record<string, any[]> = {
			Backlog: [],
			"To Do": [],
			"In Progress": [],
			Done: [],
		};

		tasksWithMeta.forEach((task) => {
			if (task.status === "backlog") taskState["Backlog"].push(task);
			else if (task.status === "doing")
				taskState["In Progress"].push(task);
			else if (task.status === "done") taskState["Done"].push(task);
			else taskState["To Do"].push(task);
		});

		for (const col of Object.keys(taskState)) {
			taskState[col].sort((a, b) => {
				if (a.order !== b.order) {
					return a.order - b.order;
				}
				return b.ctime - a.ctime;
			});
		}

		this.lastTaskState = taskState;

		const reactContainer = container.createDiv();
		this.reactRoot = ReactDOM.createRoot(reactContainer);
		this.reactRoot.render(
			React.createElement(KanbanBoard, {
				tasks: taskState,
				onOpenTask: this.onOpenTask,
				onAddTask: (status: string) => this.createNewTask(status),
				onTaskMove: (
					taskPath: string,
					newStatus: string,
					newIndex?: number
				) => this.moveTask(taskPath, newStatus, newIndex),
			})
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

		await this.app.vault.modify(file, updatedContent);
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
