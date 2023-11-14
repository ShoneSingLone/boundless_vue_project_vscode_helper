"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { camelCase } = require("lodash");
const { vueFiles } = require("./vueFiles");
const { ImportFixer } = require("./import-fixer");
const vscode = require("vscode");
const { records } = require("../server/server.db");
class ImportCompletion {
	constructor({ context, configs }) {
		this.configs = configs;
		this.context = context;
		let fixer = vscode.commands.registerCommand(
			"shone.sing.lone.resolveImport",
			args => {
				new ImportFixer({ configs }).fix(args);
			}
		);
		context.subscriptions.push(fixer);
	}
	provideCompletionItems(document, position, token) {
		return new Promise((resolve, reject) => {
			let wordToComplete = "";
			let range = document.getWordRangeAtPosition(position);
			if (range) {
				wordToComplete = document
					.getText(new vscode.Range(range.start, position))
					.toLowerCase();
			}
			const matchString = fileInfo => {
				return new RegExp(`${wordToComplete}`, "ig").test(fileInfo.fileName);
			};

			const suggestions = records.filter(matchString).map(i => this.buildCompletionItem(i, document));

			return resolve(suggestions);
		});
	}
	buildCompletionItem(importObj, document) {
		const label = camelCase(importObj.fileName);
		return {
			label: `${label}`,
			kind: vscode.CompletionItemKind.Variable,
			detail: `Boundless importVue ${importObj.fileInfo.appName || ""}`,
			documentation: `const ${label} = _.$importVue("${importObj.fileInfo.urlInSourceCode}");`,
			command: {
				title: "AI: Autocomplete",
				command: "shone.sing.lone.resolveImport",
				arguments: [{ importObj, document }]
			}
		};
	}
}
exports.ImportCompletion = ImportCompletion;