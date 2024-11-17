const { parse } = require('node-html-parser');

module.exports = function (html, callback) {
	const element = parse(html);
	callback(null, getNodes(element));
};

/** @type {(element: import('node-html-parser').Node, names?: string[]) => string[]} */
function getNodes(element, names = []) {
	for (const child of element.childNodes) {
		if (child.nodeType === 1 /* ELEMENT_NODE */) {
			names.push(child.rawTagName);
		}

		getNodes(child, names);
	}

	return names;
}
