"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class ImportFixer {
	constructor({ configs }) {
		this.businessPrefix = configs.autoImport.businessPrefix;
	}

	fix(document, range, context, token, imports) {
		let edit = this.getTextEdit(document, imports);
		vscode.workspace.applyEdit(edit);
	}

	getTextEdit(document, imports) {
		const edit = new vscode.WorkspaceEdit();
		const importObj = imports[0];

		const path = importObj.getPath(document);
		if (this.alreadyResolved(document, path, importObj.name)) {
			return edit;
		}
		if (this.shouldMergeImport(document, path)) {
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, document.lineCount, 0),
				this.mergeImports(document, edit, importObj.name, importObj.file, path)
			);
		} else if (/^\/(\/\*) *@flow/.test(document.getText())) {
			edit.insert(
				document.uri,
				new vscode.Position(1, 0),
				this.createImportStatement(
					imports[0].name,
					path,
					true,
					imports[0].isDefault
				)
			);
		} else {
			let insertPosition = document
				.positionAt(document.getText().lastIndexOf("import"))
				.translate(1, 0);
			edit.insert(
				document.uri,
				insertPosition,
				this.createImportStatement(
					imports[0].name,
					path,
					true,
					imports[0].isDefault
				)
			);
		}
		return edit;
	}
	/**
	 * @description 是否已经添加过了这个导入
	 *
	 * @param {any} document
	 * @param {any} path
	 * @param {any} importName
	 * @returns
	 *
	 * @memberOf ImportFixer
	 */
	alreadyResolved(document, path, importName) {
		let exp = new RegExp(
			"(?:import {)(?:.*)(?:} from ')(?:" + path + ")(?:';)"
		);
		let currentDoc = document.getText();
		let foundImport = currentDoc.match(exp);
		if (
			foundImport &&
			foundImport.length > 0 &&
			foundImport[0].indexOf(importName) > -1
		) {
			return true;
		}
		return false;
	}
	shouldMergeImport(document, path) {
		let currentDoc = document.getText();
		let isCommentLine = text => {
			let firstTwoLetters = text.trim().substr(0, 2);
			return firstTwoLetters === "//" || firstTwoLetters === "/*";
		};
		return currentDoc.indexOf(path) !== -1 && !isCommentLine(currentDoc);
	}
	mergeImports(document, edit, name, file, path) {
		let exp = new RegExp(
			"(?:import {)(?:.*)(?:} from ')(?:" + path + ")(?:';)"
		);
		let currentDoc = document.getText();
		let foundImport = currentDoc.match(exp);
		if (foundImport) {
			let workingString = foundImport[0];
			workingString = workingString
				.replace(/{|}|from|import|'|"| |;/gi, "")
				.replace(path, "");
			let importArray = workingString.split(",");
			importArray.push(name);
			let newImport = this.createImportStatement(importArray.join(", "), path);
			currentDoc = currentDoc.replace(exp, newImport);
		}
		return currentDoc;
	}
	createImportStatement(imp, path, endline = false, isDefault = false) {
		const importStr = `const entry = _.$importVue("./../business_anxin/entry");`;
		return importStr;
	}
	getRelativePath(document, importObj) {
		return importObj.discovered
			? importObj.fsPath
			: path.relative(path.dirname(document.fileName), importObj.fsPath);
	}
	normaliseRelativePath(importObj, relativePath) {
		let removeFileExtenion = rp => {
			if (rp) {
				rp = rp.substring(0, rp.lastIndexOf("."));
			}
			return rp;
		};
		let makeRelativePath = rp => {
			let preAppend = "./";
			if (!rp.startsWith(preAppend) && !rp.startsWith("../")) {
				rp = preAppend + rp;
			}
			if (/^win/.test(process.platform)) {
				rp = rp.replace(/\\/g, "/");
			}
			return rp;
		};
		if (importObj.discovered === undefined) {
			relativePath = makeRelativePath(relativePath);
			relativePath = removeFileExtenion(relativePath);
		}
		return relativePath;
	}
}
exports.ImportFixer = ImportFixer;
