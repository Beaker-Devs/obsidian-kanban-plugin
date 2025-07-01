import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { KanbanView, KANBAN_VIEW_TYPE, kanbanEvents } from './views/KanbanView';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(KANBAN_VIEW_TYPE, (leaf) => new KanbanView(leaf));

		this.addCommand({
			id: 'open-kanban-board',
			name: 'Open Kanban Board',
			callback: () => {
				this.activateKanbanView();
			}
		});

		this.addRibbonIcon('layout', 'Open Kanban Board', () => {
			this.activateKanbanView();
		});

		this.addCommand({
			id: 'add-task',
			name: 'Add Task',
			callback: async () => {
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
					'status: todo',
					'assignee: ',
					'priority: ',
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
		});

		this.registerEvent(this.app.vault.on('create', () => kanbanEvents.trigger('refresh')));
		this.registerEvent(this.app.vault.on('modify', () => kanbanEvents.trigger('refresh')));
		this.registerEvent(this.app.vault.on('delete', () => kanbanEvents.trigger('refresh')));

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
		this.app.workspace.getLeavesOfType(KANBAN_VIEW_TYPE).forEach((leaf) => leaf.detach());
	}

	async activateKanbanView() {
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.setViewState({
			type: KANBAN_VIEW_TYPE,
			active: true
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
