"use strict";
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { CLIENT_EMIT_TYPE_DELETE, CLIENT_EMIT_TYPE_SAVE, CLIENT_EMIT_TYPE_COMMON_VARIBLES } = require("../utils");
const { merge } = require("lodash");

class ClientScanner {
	/**
	 * Creates an instance of ClientScanner.
	 * @param  configs 
	 * @param  clientEmit IntellisenseClient.sendRequest; 
	 * 
	 * @memberOf ClientScanner
	 */
	constructor({ configs, clientEmit }) {
		const { findFilesInclude, businessPrefix, commonPrefix } = configs.analysis;
		this.commonPrefix = commonPrefix;
		this.businessPrefix = businessPrefix;
		this.findFilesInclude = findFilesInclude;
		this.configsGlobalVaribles = configs.globalVaribles;
		/*  */
		this.clientEmit = clientEmit;
	}

	get spend() {
		if (this.scanStarted) {
			// @ts-ignore
			let spend = this.scanStarted - Date.now();
			this.scanStarted = 0;
			return ` (${Math.abs(spend / 1000)}s)`;
		}
		return "";
	}

	async scanAll() {
		try {
			this.scanStarted = new Date();
			const files = await vscode.workspace.findFiles(this.findFilesInclude, "**/node_modules/**", 99999);
			await this.processWorkspaceFiles(files);
		} catch (error) {
			console.error(error);
		}
		try {
			const fsPath = path.resolve(vscode.workspace.rootPath, this.configsGlobalVaribles._);
			this.updateGlobalVaribles({ file: { fsPath } });
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * @description 
	 * @param {any} { file } 
	 * 
	 * @memberOf ClientScanner
	 */
	async updateGlobalVaribles({ file }) {
		try {
			this.clientEmit({
				type: CLIENT_EMIT_TYPE_COMMON_VARIBLES,
				payload: file
			});
		} catch (error) {
			console.error(error);
		}
	}

	editOne(request) {
		this.deleteOne(request);
		this.loadOneFile(request.file, true, request.isNeedAnalysis);
	}

	async deleteOne(request) {
		return this.clientEmit({
			type: CLIENT_EMIT_TYPE_DELETE,
			payload: {
				request
			}
		});
	}
	async processWorkspaceFiles(files) {
		let index = 0,
			file,
			length = files.length;
		while ((file = files.pop())) {
			index++;
			await this.loadOneFile(file, index === length);
		}
	}

	async loadOneFile(file, isLastOne, isNeedAnalysis = false) {
		await this.processOneFile(file, isNeedAnalysis);
		if (isLastOne) {
			vscode.window.showInformationMessage(`"boundless-vue-helper" Complete${this.spend}`);
		}
	}

	async processOneFile(fileInfo, isNeedAnalysis = false) {
		const fileName = path.basename(fileInfo.path);
		const ext = path.extname(fileInfo.path);

		const [urlInSourceCode, appName] = (() => {
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
		let requestParams = await analysisVueFile({ isNeedAnalysis, fileInfo, fileName, ext, urlInSourceCode, appName });
		const res = await this.clientEmit(requestParams);;
		return res;
	}
}
exports.ClientScanner = ClientScanner;
async function analysisVueFile({ isNeedAnalysis, fileInfo, fileName, ext, urlInSourceCode, appName }) {
	let requestParams;

	function newPayload(params = {}) {
		return merge(
			{
				appName,
				fileName: fileName.replace(ext, ""),
				ext,
				urlInSourceCode,
				fileContentString: "",
				fileInfo,
			},
			params
		);
	}

	if (isNeedAnalysis) {
		const content = await fs.promises.readFile(fileInfo.fsPath, "utf-8");
		/* TODO:解析，定义和注释 */
		/* ************************* */
		/* TODO:解析，定义和注释 */
		requestParams = {
			type: CLIENT_EMIT_TYPE_SAVE,
			payload: newPayload({ fileContentString: content })
		};
	} else {
		requestParams = {
			type: CLIENT_EMIT_TYPE_SAVE,
			payload: newPayload()
		};
	}
	return requestParams;
}

