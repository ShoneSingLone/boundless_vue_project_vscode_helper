const vscodec = require("vscode");
const path = require("path");
const { CompletionItem, CompletionItemKind, /* SnippetString */ } = require("vscode");
const { normalizedAbsolutePathForFS, asyncAllDirAndFile } = require("./utils");
const { store } = require("./store");
const { map } = require("lodash");

/**
 * @type import("vscode").CompletionItemProvider
 */
class ProviderCompletion {
	async provideCompletionItems(document, position) {
		const REG_UNDONE_PATH_REG = /"([^"]*)"|'([^']*)'|`([^`]*)`/;

		/* 由 vscode 自带的 typescript d.ts 完成 */
		/* const REG_IS_GLOBAL_VARIBLES_REG = /_\.(.*)/; */
		/* 由 vscode 自带的 typescript d.ts 完成 */
		/* const REG_VUE_VARIABLES_REG = /(Vue\._(.*)(\.(.*))?)/; */

		const isPathCompletion = () => {
			return document.getWordRangeAtPosition(position, REG_UNDONE_PATH_REG);
		};

		/* const isGlobalVaribles = () => {
			return document.getWordRangeAtPosition(
				position,
				REG_IS_GLOBAL_VARIBLES_REG
			);
		}; */
		/* const isVueVaribles = () => {
			return document.getWordRangeAtPosition(position, REG_VUE_VARIABLES_REG);
		}; */
		const { path: documentUriPath } = document.uri;

		let range;
		if ((range = isPathCompletion())) {
			const urlInSourceCode = document
				.getText(range)
				.match(REG_UNDONE_PATH_REG)[1];
			return handlePathCompletion({ urlInSourceCode, documentUriPath });
		}
		/* if ((range = isGlobalVaribles())) {
			console.log(document.getText(range));
			return handleGlobalVariblesCompletion(range);
		}
		if ((range = isVueVaribles())) {
			const property = document.getText(range).match(REG_VUE_VARIABLES_REG)[1];
			return handleVueVariblesCompletion({ range, property });
		} */
		return null;
	}
}

async function handlePathCompletion({ urlInSourceCode, documentUriPath }) {
	try {
		const completionArray = [];
		let normalizedAbsolutePath = normalizedAbsolutePathForFS({
			documentUriPath,
			urlInSourceCode,
			isGetDir: true
		});

		const [, files] = await asyncAllDirAndFile([normalizedAbsolutePath]);

		files
			.filter(i => /.vue$/.test(i))
			.forEach(file => {
				let label = file
					.replace(normalizedAbsolutePath, "")
					.replaceAll(path.sep, "/")
					.replace(/^\//, "");

				const completionItem = new CompletionItem(
					label,
					CompletionItemKind.File
				);
				completionArray.push(completionItem);
			});
		return completionArray;
	} catch (error) {
		console.error(error);
		return null;
	}
}

exports.register = context => {
	const subscription = vscodec.languages.registerCompletionItemProvider(
		[
			{ scheme: "file", language: "typescript" },
			{ scheme: "file", language: "javascript" },
			{ scheme: "file", language: "vue" }
		],
		new ProviderCompletion(),
		"/",
		"."
	);
	context.subscriptions.push(subscription);
};
