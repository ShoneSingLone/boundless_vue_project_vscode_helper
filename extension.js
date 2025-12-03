const vscode = require("vscode");
const path = require("path");
const { registerProvider } = require("./src/registerProvider.js");
const { store } = require("./src/store.js");

/**
 * @param {any} context
 */
function activate(context) {
	try {
		/* 只有root有configs.boundlessHelper.js才会激活插件 */
		store.configs = require(
			path.resolve(vscode.workspace.rootPath, "configs.boundless.vue.project.js")
		);
		registerProvider({ context });
		
		// 提示用户当前是boundless项目
		vscode.window.showInformationMessage(
			"当前项目是Boundless Vue项目，boundless-vue-helper扩展已激活，您可以使用别名跳转等功能。"
		);

		/* 可以通过ctrl+shift+p打开命令面板,manual 调用 scanner*/
		let commandScanner = vscode.commands.registerCommand(
			"shone.sing.lone.readAst",
			() => {
				let configsPath = path.resolve(vscode.workspace.rootPath, "configs.boundless.vue.project.js");
				configsPath = require.resolve(configsPath);
				delete require.cache[configsPath];
				const configs = require(configsPath);
				store.configs = configs;
			}
		);
		context.subscriptions.push(commandScanner);
		vscode.commands.executeCommand("shone.sing.lone.readAst");
	} catch (error) {
		console.error(error);
	}
}
module.exports = {
	activate,
	deactivate() { }
};
