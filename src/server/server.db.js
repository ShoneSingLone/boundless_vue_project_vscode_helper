"use strict";
const { find } = require("lodash");

const vueFiles = {
	records: [],
	get(name) {
		return vueFiles.records.filter(i => i.name === name);
	},
	delete(request) {
		try {
			let index = vueFiles.records.findIndex(
				record => record.fileInfo.path === request.file.path
			);
			if (index !== -1) {
				vueFiles.records.splice(index, 1);
			}
		} catch (error) {
			console.error(error);
		} finally {
			return true;
		}
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
		let record = find(vueFiles.records, (
			record => record.appName === appName && record.urlInSourceCode === urlInSourceCode
		));

		if (!record) {
			vueFiles.records.push({
				appName,
				ext,
				fileContentString,
				fileInfo,
				fileName,
				urlInSourceCode
			});
		}
	}
};


const commonVaribles = {
	records: [

	],
	add() {

	},
	del() {

	}
};


exports.commonVaribles = commonVaribles;

exports.vueFiles = vueFiles;


