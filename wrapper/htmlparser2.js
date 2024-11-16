const { Parser } = require('htmlparser2');

module.exports = function (html, callback) {
	let count = 0;
	const parser = new Parser({
		onopentag() {
			count++;
		},
		onend() {
			callback(null, count);
		},
		onerror(err) {
			callback(err);
		},
	});
	parser.end(html);
};
