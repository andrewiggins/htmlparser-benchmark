const tljs = require('@y21/tljs');
tljs.initializeWasmSync();

// module.exports = require('util').callbackify(tljs.parse);

module.exports = function (html, callback) {
	tljs.parse(html).then(
		(dom) => {
			let names = [];
			for (let node of dom.nodes()) {
				const name = node.asTag()?.name?.();
				if (name) names.push(name.toLowerCase());
			}

			callback(null, names);
		},
		(error) => {
			callback(error);
		},
	);
};
