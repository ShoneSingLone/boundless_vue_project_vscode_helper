const vscode = require("vscode");
const path = require("path");
const { registerProvider } = require("./src/registerProvider.js");
const { store } = require("./src/store.js");
const { scanCommonTsFile, findCommonTsFile, setupCommonTsWatcher } = require("./src/utils.autoScan.js");

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
				
				// 重新扫描common.ts文件
				const commonTsPath = findCommonTsFile();
				if (commonTsPath) {
					scanCommonTsFile(commonTsPath);
				}
			}
		);
		context.subscriptions.push(commandScanner);
		vscode.commands.executeCommand("shone.sing.lone.readAst");
		
		// 自动扫描common.ts文件
		const commonTsPath = findCommonTsFile();
		if (commonTsPath) {
			scanCommonTsFile(commonTsPath);
			// 设置文件监听器
			setupCommonTsWatcher(commonTsPath, context);
			console.log(`Auto-scan enabled for common.ts at: ${commonTsPath}`);
		} else {
			console.log("common.ts file not found, auto-scan disabled");
		}
	} catch (error) {
		console.error(error);
		
		// 即使配置文件加载失败，也尝试自动扫描common.ts文件
		try {
			const commonTsPath = findCommonTsFile();
			if (commonTsPath) {
				scanCommonTsFile(commonTsPath);
				// 设置文件监听器
				setupCommonTsWatcher(commonTsPath, context);
				console.log(`Auto-scan enabled for common.ts at: ${commonTsPath}`);
			}
		} catch (autoScanError) {
			console.error("Error in auto-scan:", autoScanError);
		}
	}
}
module.exports = {
	activate,
	deactivate() { }
};
