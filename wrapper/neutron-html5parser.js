const HTMLtoDOM = require('neutron-html5parser')();

module.exports = function (html, callback) {
	const names = [];
	const noop = function () {};
	HTMLtoDOM.Parser(html, {
		start(tagName) {
			names.push(tagName);
		},
		end: noop,
		chars: noop,
		comment: noop,
		doctype: noop,
	});

	callback(null, names);
};
