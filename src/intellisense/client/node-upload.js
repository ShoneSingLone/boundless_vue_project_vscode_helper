"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const _ = require("lodash");
const vscode = require("vscode");
const { ImportDb } = require("./import-db");
class NodeUpload {
	constructor({ findFilesInclude, useAutoImportNet }) {
		this.findFilesInclude = findFilesInclude;
		this.useAutoImportNet = useAutoImportNet;
	}
	scanNodeModules() {
		this.getMappings().then(mappings => {
			for (let key in mappings) {
				let map = mappings[key];
				if (map) {
					map.forEach(exp => {
						ImportDb.save(exp, exp, { fsPath: key }, false, true);
					});
				}
			}
		});
	}
	getMappings() {
		return new Promise(async resolve => {
			let mappings = {};
			let mapArrayToLocation = (exports, location) => {
				if (mappings[location]) {
					mappings[location] = mappings[location].concat(exports);
				} else {
					mappings[location] = exports;
				}
			};
			const files = await vscode.workspace.findFiles(
				this.findFilesInclude,
				"**/node_modules/**",
				99999
			);
			let file;
			while ((file = files.pop())) {
				FS.readFile(file.fsPath, "utf8", (err, data) => {
					if (err) {
						return console.log(err);
					}
					let matches = data.match(
						/\bimport\s+(?:.+\s+from\s+)?[\'"]([^"\']+)["\']/g
					);
					if (matches) {
						matches.forEach(m => {
							if (m.indexOf("./") === -1 && m.indexOf("!") === -1) {
								let exports = m.match(/\bimport\s+(?:.+\s+from\s+)/),
									location = m.match(/[\'"]([^"\']+)["\']/g);
								if (exports && location) {
									let exportArray = exports[0]
										.replace("import", "")
										.replace("{", "")
										.replace("}", "")
										.replace("from", "")
										.split(",")
										.map(e => {
											e = e.replace(/\s/g, "");
											return e;
										});
									mapArrayToLocation(
										exportArray,
										location[0].replace("'", "").replace("'", "")
									);
								}
							}
						});
					}
				});
			}
			for (let key in mappings) {
				if (mappings.hasOwnProperty(key)) {
					mappings[key] = _.uniq(mappings[key]);
				}
			}
			resolve(mappings);
		});
	}
}
exports.NodeUpload = NodeUpload;
