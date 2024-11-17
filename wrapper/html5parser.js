const html5parser = require('html5parser');

module.exports = (html, callback) => {
	const nodes = html5parser.parse(html);
	callback(null, getNodes(nodes));
};

/** @type {(nodes: html5parser.INode[], names?: string[]) => string[]} */
function getNodes(nodes, names = []) {
	for (const node of nodes) {
		if (
			node.type === 'Tag' &&
			node.name !== '!doctype' &&
			!node.name.startsWith('!')
		) {
			names.push(node.name);

			if (node.body) {
				getNodes(node.body, names);
			}
		}
	}

	return names;
}
