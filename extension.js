const vc = require("vscode");
const path = require("path");
const { registerProvider } = require("./src/registerProvider.js");
const { runScan } = require("./src/runScan.js");
const { store } = require("./src/store.js");

/**
 * @param {any} context
 */
function activate(context) {
	try {
		/* 只有root有configs.boundlessHelper.js才会激活插件 */
		store.configs = require(
			path.resolve(vc.workspace.rootPath, "configs.boundlessHelper.js")
		);
		registerProvider({ context });
		/* （全局变量scan） */
		runScan({ context });
	} catch (error) {
		console.error(error);
	}
}
module.exports = {
	activate,
	deactivate() {}
};
