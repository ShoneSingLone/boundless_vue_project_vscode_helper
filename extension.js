const vc = require("vscode");
const path = require("path");
const { activateIntellisense, deactivateIntellisense } = require("./src/client/client.js");
const { runClientScanner } = require("./src/client/client.analysis.js");

/**
 * @param {any} context 
 */
function activate(context) {
	try {
		/* 只有root有configs.boundlessHelper.js才会激活插件 */
		let configs = require(path.resolve(vc.workspace.rootPath, "configs.boundlessHelper.js"));
		/* 启动server */
		const IntellisenseClient =activateIntellisense({ context });
		/* 启动client （全局变量scan） */
		runClientScanner({ IntellisenseClient, configs, context });
	} catch (error) {
		console.error(error);
	}
}
function deactivate() {
	deactivateIntellisense();
}

module.exports = {
	activate,
	deactivate
};
