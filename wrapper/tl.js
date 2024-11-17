const tljs = require('@y21/tljs');
tljs.initializeWasmSync();

// module.exports = require('util').callbackify(tljs.parse);

module.exports = function (html, callback) {
	tljs.parse(html).then(
		(dom) => {
			let count = 0;
			for (let node of dom.nodes()) {
				if (node.asTag()?.name) {
					count++;
				}
			}

			callback(null, count);
		},
		(error) => {
			callback(error);
		},
	);
};
