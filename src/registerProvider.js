exports.registerProvider = function ({ context }) {
	require("./provider.Completion").register(context);
	require("./provider.Definition").register(context);
};
