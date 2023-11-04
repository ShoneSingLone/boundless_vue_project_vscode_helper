"use strict";
const vscode = require("vscode");
const { ImportAction } = require("./import-action");
const { ImportCompletion } = require("./import-completion");
const { ImportFixer } = require("./import-fixer");
const { ImportScanner } = require("./import-scanner");

class AutoImport {
	constructor({ context, configs }) {
		this.context = context;
		this.configs = configs;
	}
	start() {
		let folder = vscode.workspace.rootPath;
		return folder !== undefined;
	}
	attachCommands() {
		let codeActionFixer = vscode.languages.registerCodeActionsProvider(
			["javascript", "vue"],
			new ImportAction()
		);
		let completetion = vscode.languages.registerCompletionItemProvider(
			["javascript", "vue"],
			new ImportCompletion({ this.context }),
			""
		);

		let importScanner = vscode.commands.registerCommand(
			"shone.sing.lone.scanFile",
			request => this.scanFile(request)
		);
		let importFixer = vscode.commands.registerCommand(
			"shone.sing.lone.fixImport",
			(d, r, c, t, i) => {
				new ImportFixer({ configs: this.configs }).fix(d, r, c, t, i);
			}
		);

		this.context.subscriptions.push(
			importScanner,
			importFixer,
			codeActionFixer,
			completetion
		);
	}
	attachFileWatcher() {
		let glob = this.configs.autoImport.findFilesInclude;
		let watcher = vscode.workspace.createFileSystemWatcher(glob);
		watcher.onDidChange(file => {
			vscode.commands.executeCommand("shone.sing.lone.scanFile", {
				file,
				edit: true
			});
		});
		watcher.onDidCreate(file => {
			vscode.commands.executeCommand("shone.sing.lone.scanFile", {
				file,
				edit: true
			});
		});
		watcher.onDidDelete(file => {
			vscode.commands.executeCommand("shone.sing.lone.scanFile", {
				file,
				delete: true
			});
		});
	}
	scanAllVueSFC() {
		vscode.window.showInformationMessage(
			`"boundless-vue-helper" Building cache...`
		);
		vscode.commands.executeCommand("shone.sing.lone.scanFile", {
			showOutput: true
		});
	}
	scanFile(request) {
		let scanner = new ImportScanner(this.configs.autoImport);
		if (request.showOutput) {
			scanner.scan(request);
		} else if (request.edit) {
			scanner.edit(request);
		} else if (request.delete) {
			scanner.delete(request);
		}
	}
}

exports.AutoImport = AutoImport;
