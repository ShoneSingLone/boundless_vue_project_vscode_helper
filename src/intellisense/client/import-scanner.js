"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const { ImportDb } = require("./import-db");
const path = require("path");

class ImportScanner {
	constructor(configs) {
		this.configs = configs;
		const { findFilesInclude, businessPrefix, commonPrefix } = configs;
		this.commonPrefix = commonPrefix;
		this.businessPrefix = businessPrefix;
		this.findFilesInclude = findFilesInclude;
	}
	scan(request) {
		this.scanStarted = new Date();
		vscode.workspace
			.findFiles(this.findFilesInclude, "**/node_modules/**", 99999)
			.then(files => {
				this.processWorkspaceFiles(files);
			});
	}
	edit(request) {
		this.delete(request);
		this.loadFile(request.file, true);
	}
	delete(request) {
		ImportDb.delete(request);
	}
	processWorkspaceFiles(files) {
		let index = 0,
			file,
			length = files.length;
		while ((file = files.pop())) {
			index++;
			this.loadFile(file, index === length);
		}
	}
	loadFile(file, last) {
		this.processFile("", file);
		if (last) {
			this.scanEnded = new Date();
			vscode.window.showInformationMessage(
				`"boundless-vue-helper" Complete - (${Math.abs(
					this.scanStarted - this.scanEnded
				)}ms)`
			);
		}
	}
	processFile(fileContentString, fileInfo) {
		const fileName = path.basename(fileInfo.path);
		const ext = path.extname(fileInfo.path);
		const isDefault = true;

		const [importURL, appName] = (() => {
			if (fileInfo.path.indexOf(this.businessPrefix) > -1) {
				let url = fileInfo.path.split(this.businessPrefix)[1];
				url = url.split("/");
				const appName = url[0];
				url[0] = "@";
				return [url.join("/"), appName];
			}
			if (fileInfo.path.indexOf(this.commonPrefix) > -1) {
				const url = fileInfo.path.split(this.commonPrefix)[1];
				return [`/common/${url}`];
			}
		})();
		fileInfo.importURL = importURL;
		fileInfo.appName = appName;

		ImportDb.saveImport(
			fileName.replace(ext, ""),
			fileContentString,
			fileInfo,
			isDefault,
			null
		);
	}
}
exports.ImportScanner = ImportScanner;
