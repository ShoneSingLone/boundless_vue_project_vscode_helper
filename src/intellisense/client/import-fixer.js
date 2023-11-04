"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class ImportFixer {
	constructor({ configs }) {
		this.businessPrefix = configs.autoImport.businessPrefix;
	}

	fix({ document, importObj }) {
		let edit = this.getTextEdit(document, importObj);
		vscode.workspace.applyEdit(edit);
	}

	getTextEdit(document, importObj) {
		const edit = new vscode.WorkspaceEdit();
		const path = importObj.fileInfo.importURL;
		if (!this.alreadyResolved(document, path)) {
			const textIndexOf = document.getText().indexOf("export default async");
			let insertPosition = document.positionAt(textIndexOf);
			debugger;

			edit.insert(
				document.uri,
				insertPosition,
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
		return `const ${fileName} = _.$importVue("${path}");`;
	}
}
exports.ImportFixer = ImportFixer;
