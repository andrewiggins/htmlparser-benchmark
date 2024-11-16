const HTMLtoDOM = require('neutron-html5parser')();

module.exports = function (html, callback) {
	let count = 0;
	const noop = function () {};
	HTMLtoDOM.Parser(html, {
		start() {
			count++;
		},
		end: noop,
		chars: noop,
		comment: noop,
		doctype: noop,
	});

	callback(null, count);
};
