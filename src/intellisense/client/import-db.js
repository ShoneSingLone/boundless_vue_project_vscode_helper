"use strict";
const vscode = require("vscode");
const { PathHelper } = require("./helpers/path-helper");

class ImportObject {
	/**
	 * fileName, fileInfo, isDefault, discovered
	 * @param {any} fileName
	 * @param {any} fileInfo
	 * @param {any} isDefault
	 * @param {boolean} [discovered=false]
	 *
	 * @memberOf ImportObject
	 */
	constructor(fileName, fileInfo, isDefault, discovered = false) {
		this.fileName = fileName;
		this.fileInfo = fileInfo;
		this.isDefault = isDefault;
		this.discovered = discovered;
	}
	getPath(document) {
		if (this.discovered) {
			return this.fileInfo.fsPath;
		}
		const absolute = vscode.workspace
			.getConfiguration("autoimport")
			.get("absolute");
		let basePath = document.uri.fsPath;
		if (absolute) {
			const sourceRoot = vscode.workspace
				.getConfiguration("autoimport")
				.get("sourceRoot");
			basePath = PathHelper.joinPaths(vscode.workspace.rootPath, sourceRoot);
		}
		return PathHelper.normalisePath(
			PathHelper.getRelativePath(basePath, this.fileInfo.fsPath),
			absolute
		);
	}
}
exports.ImportObject = ImportObject;
class ImportDb {
	static get count() {
		return ImportDb.imports.length;
	}
	static all() {
		return ImportDb.imports;
	}
	static getImport(name) {
		return ImportDb.imports.filter(i => i.name === name);
	}
	static delete(request) {
		try {
			let index = ImportDb.imports.findIndex(
				m => m.file.fsPath === request.file.fsPath
			);
			if (index !== -1) {
				ImportDb.imports.splice(index, 1);
			}
		} catch (error) {}
	}
	/**
	 * @description
	 * fileName, fileContentString, fileInfo
	 *
	 * @static
	 * @param {any} fileName
	 * @param {any} fileContentString
	 * @param {any} fileInfo
	 * @param {boolean} [isDefault=false]
	 * @param {any} discovered
	 * @returns
	 *
	 * @memberOf ImportDb
	 */
	static saveImport(
		fileName,
		fileContentString,
		fileInfo,
		isDefault = false,
		discovered = false
	) {
		fileName = fileName.trim();
		if (fileName === "" || fileName.length === 1) {
			return;
		}
		let obj = new ImportObject(fileName, fileInfo, isDefault, discovered);
		let exists = ImportDb.imports.findIndex(
			m => m.name === obj.fileName && m.file.fsPath === fileInfo.fsPath
		);
		if (exists === -1) {
			ImportDb.imports.push(obj);
		}
	}
}
ImportDb.imports = new Array();
exports.ImportDb = ImportDb;
