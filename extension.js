const vc = require("vscode");
const path = require("path");
const { ProvierPathAlias } = require("./src/ProvierPathAlias.js");
const { ProvierCompletion } = require("./src/ProvierCompletion.js");
const {
	activateIntellisense
} = require("./src/intellisense/client/client.js");



function activate(context) {
	try {
		let configs = require(path.resolve(
			vc.workspace.rootPath,
			"configs.boundlessHelper.js"
		));
		configs.wsRoot = vc.workspace.rootPath;
		console.log('"boundless-vue-helper" is now active!', configs, vc.workspace.rootPath);
		initPathAlias({ context, configs });
		initCompletion({ context, configs });
		activateIntellisense({ context, configs });
	} catch (error) { }
}

function deactivate() { }

function initPathAlias({ context, configs }) {
	const subscription = vc.languages.registerDefinitionProvider(
		[
			{ scheme: "file", language: "vue" },
			{ scheme: "file", language: "javascript" }
		],
		new ProvierPathAlias(configs)
	);
	context.subscriptions.push(subscription);
}

function initCompletion({ context, configs }) {
	const subscription = vc.languages.registerCompletionItemProvider(
		[{ language: "vue", scheme: "file" }],
		new ProvierCompletion(configs),
		"/",
		"."
	);
	context.subscriptions.push(subscription);
}

module.exports = {
	activate,
	deactivate
};
