"use strict";
const { find } = require("lodash");

class RecordItem {
	/**
	 * fileName, fileInfo
	 * @param {any} fileName
	 * @param {any} fileInfo
	 *
	 * @memberOf RecordItem
	 */
	constructor(fileName, fileInfo) {
		this.name = fileName;
		this.info = fileInfo;
	}
}
exports.RecordItem = RecordItem;


const records = [];
exports.ServerDb = new Proxy({
	all() {
		return records;
	},
	get(name) {
		return records.filter(i => i.name === name);
	},
	delete(request) {
		try {
			let index = records.findIndex(
				m => m.file.fsPath === request.file.fsPath
			);
			if (index !== -1) {
				records.splice(index, 1);
			}
		} catch (error) { }
	},
	/**
	 * @description 
	 * 
	 * @param {any} { appName, ext, fileContentString, fileInfo, fileName, urlInSourceCode } 
	 * @returns 
	 */
	save({ appName, ext, fileContentString, fileInfo, fileName, urlInSourceCode }) {
		appName = appName || "";
		fileName = fileName.trim();
		if (fileName === "" || fileName.length === 1) {
			return;
		}
		let record = find(records, (
			record => record.appName === appName && record.urlInSourceCode === urlInSourceCode
		));

		if (!record) {
			records.push({
				appName,
				ext,
				fileContentString,
				fileInfo,
				fileName,
				urlInSourceCode
			});
		}
	}
}, {
	get(obj, prop) {
		if (prop === 'count') {
			return records.length;
		}
		if (prop === 'records') {
			return records;
		}
		return obj[prop];
	},
	set(obj, prop, value) {
		obj[prop] = value;
		return true;
	}
});


exports.records = records;