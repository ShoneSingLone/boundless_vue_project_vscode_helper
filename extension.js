// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vc = require("vscode");
const fs = require("fs");
const path = require("path");
const { ProvierPathAlias } = require("./src/ProvierPathAlias.js");
const { ProvierCompletion } = require("./src/ProvierCompletion.js");
const { activateIntellisense, deactivateIntellisense } = require("./src/intellisense/client/client.js");

// const { CodeAction } = require("./src/CodeAction.js");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vc.ExtensionContext} context
 */
function activate(context) {
  console.log("boundless-vue-helper rootPath", vc.workspace.rootPath);
  // vc.window.showInformationMessage(vc.workspace.rootPath);
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  try {
    let configs = require(
      path.resolve(vc.workspace.rootPath, "configs.boundlessHelper.js"),
    );
    // @ts-ignore
    configs.wsRoot = vc.workspace.rootPath;
    // @ts-ignore
    console.log('"boundless-vue-helper" is now active!', configs);
    initPathAlias({ context, configs });
    initCompletion({ context, configs });
    activateIntellisense({ context, configs });
  } catch (error) { }
}

// This method is called when your extension is deactivated
function deactivate() {
  try {
    require(path.resolve(vc.workspace.rootPath, "configs.boundlessHelper.js"));
    deactivateIntellisense();
  } catch (error) { }
}

/* function initCodeActionn({ context, configs }) {
    const subscription = vc.languages.registerDefinitionProvider(
        [{ language: "vue", scheme: "file" }],
        new CodeAction()
    );
    context.subscriptions.push(subscription);
} */
function initPathAlias({ context, configs }) {
  const subscription = vc.languages.registerDefinitionProvider(
    [
      { scheme: "file", language: "vue" },
      { scheme: "file", language: "javascript" },
    ],
    new ProvierPathAlias(configs),
  );
  context.subscriptions.push(subscription);
}


function initCompletion({ context, configs }) {
  const subscription = vc.languages.registerCompletionItemProvider(
    [{ language: "vue", scheme: "file" }],
    new ProvierCompletion(configs),
    "/",
    ".",
  );
  context.subscriptions.push(subscription);
}

module.exports = {
  activate,
  deactivate,
};
