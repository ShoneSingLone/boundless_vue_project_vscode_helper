"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const { camelCase } = require("lodash");
class ImportFixer {
	constructor({ configs }) {
		this.businessPrefix = configs.analysis.businessPrefix;
	}

	fix({ document, importObj }) {
		let edit = this.getTextEdit(document, importObj);
		vscode.workspace.applyEdit(edit);
	}

	getTextEdit(document, importObj) {
		const edit = new vscode.WorkspaceEdit();
		const path = importObj.fileInfo.urlInSourceCode;
		if (!this.alreadyResolved(document, path)) {
			const textIndexOf = document.getText().indexOf("export default async");
			const position = document.positionAt(textIndexOf);
			edit.insert(
				document.uri,
				position.translate(1, 0),
				this.createImportStatement(importObj.fileName, path)
			);
		}
		return edit;
	}
	/**
	 * @description 是否已经添加过了这个导入
	 */
	alreadyResolved(document, path) {
		let currentDoc = document.getText();
		return currentDoc.includes(path);
	}
	createImportStatement(fileName, path) {
		return `\tconst ${camelCase(fileName)} = _.$importVue("${path}");\n`;
	}
}
exports.ImportFixer = ImportFixer;
