"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const { ImportDb } = require("./import-db");
const path = require("path");
const fs = require("fs");

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
		this.loadFile(request.file, true, request.analysis);
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
	loadFile(file, last, isNeedAnalysis = false) {
		this.processFile(file, isNeedAnalysis);
		if (last) {
			this.scanEnded = new Date();
			// @ts-ignore
			this.scanStarted &&
				vscode.window.showInformationMessage(
					`"boundless-vue-helper" Complete - (${Math.abs(
						this.scanStarted - this.scanEnded
					)}ms)`
				);
		}
	}
	processFile(fileInfo, isNeedAnalysis = false) {
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

		if (isNeedAnalysis) {
			fs.promises.readFile(fileInfo.fsPath, "utf-8").then(content => {
				/* 解析，定义和注释 */
				ImportDb.saveImport(
					fileName.replace(ext, ""),
					content,
					fileInfo,
					isDefault,
					null
				);
			});
		} else {
			ImportDb.saveImport(
				fileName.replace(ext, ""),
				"",
				fileInfo,
				isDefault,
				null
			);
		}
	}
}
exports.ImportScanner = ImportScanner;
