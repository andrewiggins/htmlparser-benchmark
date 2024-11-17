const parse5 = require('parse5');

module.exports = function (html, callback) {
	const dom = parse5.parse(html.toString());
	callback(null, getNodes(dom));
};

/**
 * @typedef {import('parse5').DefaultTreeAdapterMap['parentNode']} ParentNode
 * @type {(node: ParentNode, names?: string[]) => string[]}
 */
function getNodes(node, names = []) {
	for (const child of node.childNodes) {
		if ('tagName' in child) {
			names.push(child.tagName.toLowerCase());

			if (child.tagName === 'noscript' && child.childNodes.length) {
				const textNode = child.childNodes[0];
				if ('value' in textNode) {
					getNodes(parse5.parseFragment(textNode.value), names);
				}
			}
		}

		if ('childNodes' in child) {
			getNodes(child, names);
		}
	}

	return names;
}
