/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
let IntellisenseClient;
const path = require("path");
const { workspace } = require("vscode");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

/**
 * @description ExtensionContext
 *
 * @export
 * @param {any} context
 */
function activate({ context }) {
	// The server is implemented in node
	const serverPath = path.join("src", "server", "server.js");
	const serverModule = context.asAbsolutePath(serverPath);

	/**
	 * Options to control the language client
	 * @type import("vscode-languageclient").LanguageClientOptions
	 */

	// Create the language client and start the client.
	IntellisenseClient = new LanguageClient(
		"vueBoundless",
		"Vue Language Server Boundless",
		/* serverOptions */
		{
			run: { module: serverModule, transport: TransportKind.ipc },
			debug: {
				module: serverModule,
				transport: TransportKind.ipc,
				options: {
					execArgv: [`--inspect=${6010}`]
				}
			}
		},
		{
			/* .js .vue 会触发 */
			documentSelector: [
				{ scheme: "file", language: "javascript" },
				{ scheme: "file", language: "vue" }
			],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher("**/.clientrc")
			}
		}
	);

	// Start the client. This will also launch the server
	IntellisenseClient.start();
	return IntellisenseClient;
}

function deactivate() {
	if (!IntellisenseClient) {
		return undefined;
	}
	return IntellisenseClient.stop();
}

exports.activateIntellisense = activate;
exports.deactivateIntellisense = deactivate;