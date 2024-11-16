const htmljs = require('htmljs-parser');

module.exports = function (html, callback) {
	let count = 0;
	const parser = htmljs.createParser({
		onOpenTagName() {
			count++;
		},
	});
	parser.parse(html);
	callback(null, count);
};
