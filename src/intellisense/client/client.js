/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
let IntellisenseClient;
const path = require("path");
const { workspace } = require("vscode");
const { AutoImport } = require("./auto-import");

const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

/**
 * @description ExtensionContext
 *
 * @export
 * @param {any} context
 */
function activate({ context, configs }) {
	try {
		if (!context.workspaceState.get("boundlessAutoImportConfigs")) {
			context.workspaceState.update("boundlessAutoImportConfigs", {});
		}

		let extension = new AutoImport({ context, configs });
		let start = extension.start();
		if (!start) {
			return;
		}
		extension.attachCommands();
		extension.attachFileWatcher();
		extension.scanAllVueSFC();
	} catch (error) {
		console.error(error);
	}

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join("src", "intellisense", "server", "server.js")
	);

	const debugOptions = {
		execArgv: ["--nolazy", "--inspect=6009"]
	};

	const serverOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	/* LanguageClientOptions */
	const clientOptions = {
		/* .js .vue 会触发 */
		documentSelector: [
			{ scheme: "file", language: "javascript" },
			{ scheme: "file", language: "vue" }
		],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher("**/.clientrc")
		}
	};

	// Create the language client and start the client.
	IntellisenseClient = new LanguageClient(
		"languageServerBoundless",
		"Language Server Boundless",
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	IntellisenseClient.start();
}

function deactivate() {
	if (!IntellisenseClient) {
		return undefined;
	}
	return IntellisenseClient.stop();
}

exports.activateIntellisense = activate;
exports.deactivateIntellisense = deactivate;
