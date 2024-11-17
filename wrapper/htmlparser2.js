const { Parser } = require('htmlparser2');

module.exports = function (html, callback) {
	const names = [];
	const parser = new Parser({
		onopentag(name) {
			names.push(name);
		},
		onend() {
			callback(null, names);
		},
		onerror(err) {
			callback(err);
		},
	});
	parser.end(html);
};
