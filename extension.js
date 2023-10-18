// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vc = require('vscode');
const fs = require('fs');
const path = require('path');
const { VueProvier } = require("./importVue/VueProvider.js");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vc.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "myvscodeextension" is now active!');
	try {
		console.log("vc.workspace.rootPath", vc.workspace.rootPath);
		let configs = fs.readFileSync(
			path.resolve(vc.workspace.rootPath, "package.json"),
			"utf-8"
		);
		configs = JSON.parse(configs) || {};
		// @ts-ignore
		if (configs.useImportVue) {
			const provierImportVue = vc.languages.registerDefinitionProvider(
				[{ language: "vue", scheme: "file" }],
				// @ts-ignore
				new VueProvier(configs)
			);
			context.subscriptions.push(provierImportVue);
		}
	} catch (error) { }

}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
};
