const path = require("path");
const fs = require("fs");
const {
	CompletionItem,
	CompletionItemKind,
	Disposable,
	workspace,
	window,
	MarkdownString
} = require("vscode");
const {
	getIndexOfWorkspaceFolder,
	isObject,
	getInsertPathRange,
	getNormalizedAbsolutePath,
	asyncAllDirAndFile
} = require("./utils");

/**
 * @type import("vscode").CompletionItemProvider
 */
class ProvierCompletion {
	_aliasList;
	_statMap;
	_disposable;
	_ignoreExtensionList;
	_needExtension;
	_autoSuggestion;
	_configs;

	constructor(configs) {
		this.ALIAS_PATH_CACHE = {};
		this._configs = configs;
		workspace.onDidChangeConfiguration(e => {
			console.log("onDidChangeConfiguration", e);
		});
		this._disposable = Disposable.from();
	}
	dispose() {
		this._disposable.dispose();
	}

	get cptAliasArray() {
		if (!this._configs?._aliasArray) {
			const { alias } = this._configs || {};
			if (alias) {
				this._configs._aliasArray = Object.entries(alias);
			}
		}
		return this._configs._aliasArray;
	}

	async provideCompletionItems(document, position) {
		let completionArray = [];
		/* 未完成的就补充路径 */
		const reg_undone_path = /"([^"]*)\/"|'([^']*)\/'|`([^`]*)\/`/;
		let range = document.getWordRangeAtPosition(position, reg_undone_path);
		if (range) {
			completionArray = await this.handlePathCompletion(document, range);
		} else {
			const reg_obj_prop = /\w/;
			range = document.getWordRangeAtPosition(position, reg_obj_prop);
			if (range) {
				const variable = document.getText(range);

				const completionItem = new CompletionItem(
					`_.$${variable}`,
					CompletionItemKind.Property
				);
				completionArray.push(completionItem);
				// completionArray = await this.handlePathCompletion(document, range);
			}
		}
		return completionArray;
	}

	async handlePathCompletion(document, range) {
		const completionArray = [];
		const ALIAS_PATH = document.getText(range).replace(/["|'|`]/g, "");

		const { path: DOC_URI_PATH } = document.uri;

    let normalizedAbsolutePath = getNormalizedAbsolutePath({
      DOC_URI_PATH,
      ALIAS_PATH,
      ALIAS_ARRAY: this.cptAliasArray,
      ROOT_PATH: this._configs.wsRoot || "",
      ALIAS_PATH_CACHE: this.ALIAS_PATH_CACHE,
      isGetDirContent: true
    });

		const [, files] = await asyncAllDirAndFile([normalizedAbsolutePath]);

		files
			.filter(i => /.vue$/.test(i))
			.forEach(file => {
				let label = file
					.replace(normalizedAbsolutePath, "")
					.replaceAll(path.sep, "/")
					.replace(/^\//, "");

				const completionItem = new CompletionItem(
					label,
					CompletionItemKind.File
				);

				completionArray.push(completionItem);
			});
		return completionArray;
	}
}

exports.ProvierCompletion = ProvierCompletion;
