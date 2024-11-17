const html5parser = require('html5parser');

module.exports = (html, callback) => {
	const nodes = html5parser.parse(html);
	callback(null, countNodes(nodes));
};

/** @type {(nodes: html5parser.INode[], count?: number) => number} */
function countNodes(nodes, count = 0) {
	for (const node of nodes) {
		if (node.type === 'Tag') {
			count++;

			if (node.body) {
				count = countNodes(node.body, count);
			}
		}
	}
	return count;
}
