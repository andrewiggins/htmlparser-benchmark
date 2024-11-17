// The parser states
// The parser states
const TEXT = 0;
const BEFORE_OPEN_TAG = 1;
const OPENING_TAG = 2;
const AFTER_OPENING_TAG = 3;
const IN_VALUE_NO_QUOTES = 4;
const IN_VALUE_SINGLE_QUOTES = 5;
const IN_VALUE_DOUBLE_QUOTES = 6;
const CLOSING_OPEN_TAG = 7;
const OPENING_SPECIAL = 8;
const OPENING_DOCTYPE = 9;
const OPENING_NORMAL_COMMENT = 10;
const NORMAL_COMMENT_START = 11;
const IN_NORMAL_COMMENT = 12;
const IN_SHORT_COMMENT = 13;
const CLOSING_NORMAL_COMMENT = 14;
const CLOSING_NORMAL_COMMENT_2 = 15;
const CLOSING_TAG = 16;

// Special characters
const EXCLAMATION = 33; // !
const DASH = 45; // -
const SLASH = 47; // /
/** > greater than */
const CLOSE_NODE = 62; // >
/** < Less than */
const START_NODE = 60; // <
const QUESTION = 63; // ?
const SINGLE_QUOTE = 39; // '
const DOUBLE_QUOTE = 34; // "
const EQUAL = 61; // =
const CAPITAL_A = 65; // A
const CAPITAL_D = 68; // D
const CAPITAL_Z = 90; // Z
const LOWERCASE_A = 97; // a
const LOWERCASE_C = 99; // c
const LOWERCASE_D = 100; // d
const LOWERCASE_E = 101; // e
const LOWERCASE_I = 105; // i
const LOWERCASE_L = 108; // l
const LOWERCASE_P = 112; // p
const LOWERCASE_R = 114; // r
const LOWERCASE_S = 115; // s
const LOWERCASE_T = 116; // t
const LOWERCASE_Y = 121; // y
const LOWERCASE_Z = 122; // z

const isWhitespace = (c: number) =>
	c === 9 || // Tab '\t'
	c === 10 || // New line '\n'
	c === 11 || // Vertical tab '\v'
	c === 12 || // Form feed '\f'
	c === 13 || // Carriage return '\r'
	c === 32; // Space ' '

function isVoidElement(name: string): boolean {
	return (
		name === 'area' ||
		name === 'base' ||
		name === 'br' ||
		name === 'col' ||
		name === 'command' ||
		name === 'embed' ||
		name === 'hr' ||
		name === 'img' ||
		name === 'input' ||
		name === 'keygen' ||
		name === 'link' ||
		name === 'meta' ||
		name === 'param' ||
		name === 'source' ||
		name === 'track' ||
		name === 'wbr'
	);
}

type ParseChunk = (chunk: string) => number;

export function createParser(
	handleOpenTag: (name: string) => boolean,
	handleCloseTag: () => boolean,
): ParseChunk {
	let state: number = TEXT;
	let name: string = '';
	let inScriptOrStyle: string | null = null;

	function emitOpenTag(name: string, isSelfClosing: boolean) {
		let shouldPause = handleOpenTag(name);
		if (name === 'script' || name === 'style') {
			inScriptOrStyle = name;
		}

		if (isSelfClosing || isVoidElement(name)) {
			shouldPause ||= handleCloseTag();
			inScriptOrStyle = null;
		}

		return shouldPause;
	}

	function possiblyClosesScriptOrStyle(char: number) {
		char |= 0x20; // Lowercase
		if (inScriptOrStyle == 'script') {
			return (
				char === LOWERCASE_S ||
				char === LOWERCASE_C ||
				char === LOWERCASE_R ||
				char === LOWERCASE_I ||
				char === LOWERCASE_P ||
				char === LOWERCASE_T
			);
		} else if (inScriptOrStyle == 'style') {
			return (
				char === LOWERCASE_S ||
				char === LOWERCASE_T ||
				char === LOWERCASE_Y ||
				char === LOWERCASE_L ||
				char === LOWERCASE_E
			);
		}

		return false;
	}

	return function parseChunk(chunk: string): number {
		// let shouldPause = false;
		let i = 0;
		let char = 0;
		let chunkLength = chunk.length;

		while (i < chunkLength) {
			char = chunk.charCodeAt(i);

			switch (state) {
				case TEXT:
					if (char === START_NODE) {
						state = BEFORE_OPEN_TAG;
					}
					break;
				case BEFORE_OPEN_TAG:
					if (inScriptOrStyle) {
						if (char === SLASH) {
							state = CLOSING_TAG; // </ - Possible closing tag for the script or style tag
							name = '';
						} else {
							state = TEXT; // < - Not a closing tag, go back to text
						}
					} else if (
						(char >= CAPITAL_A && char <= CAPITAL_Z) ||
						(char >= LOWERCASE_A && char <= LOWERCASE_Z)
					) {
						// Only A-Z and a-z are valid start to tag names in HTML5
						name = String.fromCharCode(char | 0x20); // Lowercase
						state = OPENING_TAG; // <name
					} else if (char === SLASH) {
						state = CLOSING_TAG; // </name
						name = '';
					} else if (char === START_NODE) {
						state = BEFORE_OPEN_TAG; // << - Treat the first '<' as text
					} else if (char === EXCLAMATION) {
						state = OPENING_SPECIAL; // <! - Special tag
					} else if (char === QUESTION) {
						state = IN_SHORT_COMMENT; // <? - Short comment
					} else {
						state = TEXT; // <>
					}
					break;
				case OPENING_TAG:
					if (isWhitespace(char)) {
						state = AFTER_OPENING_TAG; // <name   >
					} else if (char === CLOSE_NODE) {
						state = TEXT; // <name>

						// shouldPause = emitOpenTag(name, false);
						emitOpenTag(name, false);
						name = '';
					} else if (char === SLASH) {
						state = CLOSING_OPEN_TAG; // <name/
					} else {
						name += String.fromCharCode(char | 0x20); // Lowercase
					}
					break;
				case AFTER_OPENING_TAG:
					if (char === CLOSE_NODE) {
						state = TEXT; // <name   >

						// shouldPause = emitOpenTag(name, false);
						emitOpenTag(name, false);
						name = '';
					} else if (char === SLASH) {
						state = CLOSING_OPEN_TAG; // <name   /
					} else if (char === SINGLE_QUOTE) {
						state = IN_VALUE_SINGLE_QUOTES;
					} else if (char === DOUBLE_QUOTE) {
						state = IN_VALUE_DOUBLE_QUOTES;
					} else if (!isWhitespace(char)) {
						state = IN_VALUE_NO_QUOTES;
					}
					break;
				case IN_VALUE_NO_QUOTES:
					if (char === CLOSE_NODE) {
						state = TEXT; // <div xxx>

						// shouldPause = emitOpenTag(name, false);
						emitOpenTag(name, false);
						name = '';
					} else if (char === SLASH) {
						state = CLOSING_OPEN_TAG; // <div xxx/
					} else if (char === EQUAL) {
						state = AFTER_OPENING_TAG; /// <div xxx=
					} else if (isWhitespace(char)) {
						state = AFTER_OPENING_TAG;
					}
					break;
				case IN_VALUE_SINGLE_QUOTES:
					if (char === SINGLE_QUOTE) {
						state = AFTER_OPENING_TAG; // <div xxx='yyy'>
					}
					break;
				case IN_VALUE_DOUBLE_QUOTES:
					if (char === DOUBLE_QUOTE) {
						state = AFTER_OPENING_TAG; // <div xxx="yyy">
					}
					break;
				case CLOSING_OPEN_TAG:
					if (char === CLOSE_NODE) {
						state = TEXT; // <name />

						// shouldPause = emitOpenTag(name, true);
						emitOpenTag(name, true);
						name = '';
					} else {
						state = AFTER_OPENING_TAG; // <name /...>
						i--; // Re-process the character
					}
					break;
				case OPENING_SPECIAL:
					if (char === DASH) {
						state = OPENING_NORMAL_COMMENT; // <!-
					} else if (char === CAPITAL_D || char === LOWERCASE_D) {
						state = OPENING_DOCTYPE; // <!D
						name = String.fromCharCode(char | 0x20); // Lowercase
					} else {
						state = IN_SHORT_COMMENT; // <!...
					}
					break;
				case OPENING_DOCTYPE:
					if (CLOSE_NODE) {
						state = TEXT; // <!DOCTYPE> or <!DOCT>
					}
					break;
				case OPENING_NORMAL_COMMENT:
					if (char === DASH) {
						state = NORMAL_COMMENT_START; // <!--
					} else {
						state = IN_SHORT_COMMENT; // <!-
					}
					break;
				case NORMAL_COMMENT_START:
					if (char === CLOSE_NODE) {
						state = TEXT; // <!-->
					} else if (char === DASH) {
						state = NORMAL_COMMENT_START; // <!--- ...
					} else {
						state = IN_NORMAL_COMMENT; // <!-- -
					}
					break;
				case IN_NORMAL_COMMENT:
					if (char === DASH) {
						state = CLOSING_NORMAL_COMMENT; // <!-- ... -
					}
					break;
				case IN_SHORT_COMMENT:
					if (char === CLOSE_NODE) {
						state = TEXT; // <? ... >
					}
					break;
				case CLOSING_NORMAL_COMMENT:
					if (char === DASH) {
						state = CLOSING_NORMAL_COMMENT_2; // <!-- ... --
					} else {
						state = IN_NORMAL_COMMENT; // <!-- ... - ...
					}
					break;
				case CLOSING_NORMAL_COMMENT_2:
					if (char === DASH) {
						state = CLOSING_NORMAL_COMMENT_2; // <!-- ... ----
					} else if (char === CLOSE_NODE) {
						state = TEXT; // <!-- ... -->
					} else {
						state = IN_NORMAL_COMMENT; // <!-- ... --x
					}
					break;
				case CLOSING_TAG:
					if (inScriptOrStyle) {
						if (char === START_NODE) {
							state = BEFORE_OPEN_TAG; // </< - First `</` wasn't a closing tag, but this next `<` could be
						} else if (char === CLOSE_NODE) {
							// Check if the closing tag is for the script or style tag
							if (name === inScriptOrStyle) {
								state = TEXT; // </script>

								// shouldPause = handleCloseTag(name);
								name = '';
								inScriptOrStyle = null;
							} else {
								state = TEXT; // </name> but not for the script or style tag
							}
						} else if (possiblyClosesScriptOrStyle(char)) {
							name += String.fromCharCode(char | 0x20); // Lowercase
						} else {
							state = TEXT; // </scrXXX or </styXXX
						}
					} else if (char === CLOSE_NODE) {
						state = TEXT; // </name>

						// shouldPause = handleCloseTag(name);
						name = '';
					} else {
						name += String.fromCharCode(char | 0x20); // Lowercase
					}
					break;
				default:
					throw new Error(`Invalid state: ${state}`);
			}

			i++;

			// if (shouldPause) {
			// 	break;
			// }
		}

		return i;
	};
}

export default function (html, callback) {
	const names: string[] = [];

	const parseChunk = createParser(
		(name) => {
			names.push(name);
			return false;
		},
		() => false,
	);
	parseChunk(html);

	callback(null, names);
}