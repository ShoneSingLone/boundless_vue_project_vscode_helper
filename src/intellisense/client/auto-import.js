"use strict";
const vscode = require("vscode");
// const { ImportAction } = require("./import-action");
const { ImportCompletion } = require("./import-completion");
// const { ImportFixer } = require("./import-fixer");
const { ImportScanner } = require("./import-scanner");
const { some } = require("lodash");

class AutoImport {
	constructor({ context, configs }) {
		this.context = context;
		this.configs = configs;

		let start = this.start();
		if (!start) {
			return;
		}
		this.registeCommands();
		this.watchFiles();
		this.scanVueSFC();
	}
	start() {
		let folder = vscode.workspace.rootPath;
		return folder !== undefined;
	}
	isNeedAnalysis(file) {
		return some(this.configs.vueVaribles, path => {
			return file.path.indexOf(path) > -1;
		});
	}

	registeCommands() {
		let completetion = vscode.languages.registerCompletionItemProvider(
			["javascript", "vue"],
			new ImportCompletion(this),
			""
		);

		let importScanner = vscode.commands.registerCommand(
			"shone.sing.lone.scanFile",
			request => this.scanFile(request)
		);

		/* let importFixer = vscode.commands.registerCommand( "shone.sing.lone.fixImport", (document, range, context, token, imports ) => { new ImportFixer({ configs: this.configs }).fix({ document, range, context, token, imports }); } ); */
		this.context.subscriptions.push(
			importScanner,
			completetion /* importFixer, */
		);
	}
	watchFiles() {
		let watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(
				vscode.Uri.file(vscode.workspace.rootPath),
				this.configs.autoImport.findFilesInclude
			)
		);
		watcher.onDidChange(file => {
			if (this.isNeedAnalysis(file)) {
				vscode.commands.executeCommand("shone.sing.lone.scanFile", {
					file,
					edit: true,
					analysis: true
				});
			}
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

		let watcheLodash = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(
				vscode.Uri.file(vscode.workspace.rootPath),
				this.configs.globalVaribles._
			)
		);
		watcheLodash.onDidChange(file => {
			vscode.commands.executeCommand("shone.sing.lone.scanFile", {
				file,
				edit: true
			});
		});
	}
	scanVueSFC() {
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
