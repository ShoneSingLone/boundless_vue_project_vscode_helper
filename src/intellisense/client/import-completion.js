"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { camelCase } = require("lodash");
const { ImportDb } = require("./import-db");
const { ImportFixer } = require("./import-fixer");
const vscode = require("vscode");
class ImportCompletion {
	constructor(context) {
		this.context = context;
		let fixer = vscode.commands.registerCommand(
			"shone.sing.lone.resolveImport",
			args => {
				new ImportFixer().fix(args.document, undefined, undefined, undefined, [
					args.imp
				]);
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

			const suggestions = ImportDb.all()
				.filter(matchString)
				.map(i => this.buildCompletionItem(i, document));

			return resolve(suggestions);
		});
	}
	buildCompletionItem(imp, document) {
		const label = camelCase(imp.fileName);
		return {
			label,
			kind: vscode.CompletionItemKind.Variable,
			detail: `Boundless importVue`,
			documentation: `const ${label} = _.$importVue("${imp.getPath(
				document
			)}");`,
			command: {
				title: "AI: Autocomplete",
				command: "shone.sing.lone.resolveImport",
				arguments: [{ imp, document }]
			}
		};
	}
}
exports.ImportCompletion = ImportCompletion;
