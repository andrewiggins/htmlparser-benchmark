const { default: Tokenizer } = require('htmlparser2/lib/Tokenizer');

const noop = () => {};
module.exports = function (html, callback) {
	const names = [];
	const tokenizer = new Tokenizer(
		{ decodeEntities: false, xmlMode: false },
		{
			onopentagname(startIndex, endIndex) {
				names.push(html.slice(startIndex, endIndex).toLowerCase());
			},
			onend: () => callback(null, names),
			onattribdata: noop,
			onattribend: noop,
			onattribname: noop,
			onattribentity: noop,
			oncdata: noop,
			onclosetag: noop,
			oncomment: noop,
			ondeclaration: noop,
			onopentagend: noop,
			onprocessinginstruction: noop,
			onselfclosingtag: noop,
			ontext: noop,
			ontextentity: noop,
		},
	);

	tokenizer.write(html);
	tokenizer.end();
};
