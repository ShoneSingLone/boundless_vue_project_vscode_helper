const vc = require("vscode");
const path = require("path");
const { DefinitionPathAlias } = require("./src/DefinitionPathAlias.js");
const { ProvierCompletion } = require("./src/ProvierCompletion.js");
const {
	activateIntellisense,
	deactivateIntellisense
} = require("./src/intellisense/client/client.js");

function activate(context) {
	try {
		let configs = require( path.resolve(vc.workspace.rootPath, "configs.boundlessHelper.js") );
		configs.wsRoot = vc.workspace.rootPath;
		console.log(
			'"boundless-vue-helper" is now active!',
			configs,
			vc.workspace.rootPath
		);
		initPathAlias({ context, configs });
		// initCompletion({ context, configs });
		activateIntellisense({ context, configs });
	} catch (error) {}
}

/**
 * @description 路径跳转
 *
 * @param {any} { context, configs }
 */
function initPathAlias({ context, configs }) {
	const subscription = vc.languages.registerDefinitionProvider(
		[
			{ scheme: "file", language: "vue" },
			{ scheme: "file", language: "javascript" }
		],
		new DefinitionPathAlias(configs)
	);
	context.subscriptions.push(subscription);
}

/**
 * @description 补全路径
 *
 * @param {any} { context, configs }
 */
function initCompletion({ context, configs }) {
	const subscription = vc.languages.registerCompletionItemProvider(
		[{ language: "vue", scheme: "file" }],
		new ProvierCompletion(configs),
		"/"
	);
	context.subscriptions.push(subscription);
}

function deactivate() {
	deactivateIntellisense();
}

module.exports = {
	activate,
	deactivate
};
