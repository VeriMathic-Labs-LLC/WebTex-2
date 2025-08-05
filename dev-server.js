const express = require("express");
const path = require("node:path");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const config = require("./config/webpack.config.js");
const opn = require('opn');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_PATH = path.join(__dirname, "dist");

// Serve static files from the dist directory
app.use(express.static(PUBLIC_PATH));

// Set up webpack-dev-middleware for development
if (process.env.NODE_ENV !== "production") {
	const compiler = webpack({ ...config, mode: "development" });

	app.use(
		webpackDevMiddleware(compiler, {
			publicPath: config.output.publicPath,
			stats: "minimal",
		}),
	);
}

// Serve the main HTML file for all routes (for SPA support)
app.get("*", (_req, res) => {
	res.sendFile(path.join(PUBLIC_PATH, "index.html"));
});

// Start the server
app.listen(PORT, () => {
	const url = `http://localhost:${PORT}`;
	console.log(`\n\x1b[32mDevelopment server running at:\x1b[0m \x1b[4m${url}\x1b[0m\n`);

	// Open the default browser to the app
	if (process.env.OPEN_BROWSER !== "false") {
		opn(url).catch(() => {
			console.log("Unable to open browser. Please visit:", url);
		});
	}
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});
