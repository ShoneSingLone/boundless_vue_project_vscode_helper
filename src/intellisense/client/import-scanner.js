"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { NodeUpload } = require("./node-upload");
const vscode = require("vscode");
const { ImportDb } = require("./import-db");
const { AutoImport } = require("./auto-import");
const path = require("path");

class ImportScanner {
	constructor(configs) {
		const { findFilesInclude, showNotifications, higherOrderComponents } =
			configs;
		this.configs = configs;
		this.findFilesInclude = findFilesInclude;
		this.showNotifications = showNotifications;
		this.higherOrderComponents = higherOrderComponents;
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
