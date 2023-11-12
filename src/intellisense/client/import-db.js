"use strict";
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
}
exports.ImportObject = ImportObject;


const records = [];
exports.ImportDb = new Proxy({
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
	save(
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
		let obj = { fileName, fileInfo, isDefault, discovered };
		let exists = records.findIndex(
			m => m.name === obj.fileName && m.file.fsPath === fileInfo.fsPath
		);
		if (exists === -1) {
			records.push(obj);
			console.log("🚀 ~ file: import-db.js:71 ~ records:", records);
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