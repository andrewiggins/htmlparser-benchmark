const { parse } = require('node-html-parser');

module.exports = function (html, callback) {
	const element = parse(html);
	callback(null, countNodes(element));
};

/** @type {(element: import('node-html-parser').Node, count?: number) => number} */
function countNodes(element, count = 0) {
	for (const child of element.childNodes) {
		if (
			child.nodeType === 1 /* ELEMENT_NODE */ ||
			child.nodeType === 8 /* COMMENT_NODE */
		) {
			count++;
		}

		count = countNodes(child, count);
	}
	return count;
}
