import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const wrappers = fs
	.readdirSync(path.join(__dirname, 'wrapper'))
	.map((filename) => ({
		name: path.basename(filename, '.js'),
		parser: path.join(__dirname, 'wrapper', filename),
	}))
	.filter(
		({ name }) =>
			// name === 'htmljs-parser' || // Doesn't parse the entire file eagerly
			name.includes('streaming') ||
			name === 'tl' ||
			name === 'htmlparser2' ||
			name === 'neutron-html5parser' ||
			name === 'html5parser' ||
			name === 'node-html-parser' ||
			name === 'parse5',
	);

const html = fs.readFileSync(
	path.join(
		__dirname,
		'files/b7660c4d40274010176c79271f7ed0c2d4612fa2a68efb92b30cfe68cc400e5e.html',
	),
	'utf8',
);

/**
 * @typedef {{name: string; tagNames: string[]; time: number; }} Result
 * @type {Result[]}
 */
const results = [];
for (const { name, parser } of wrappers) {
	const m = await import(parser);

	/** @type {Result} */
	const result = await new Promise(async (resolve, reject) => {
		const tic = process.hrtime();
		m.default(html, (err, tagNames) => {
			const toc = process.hrtime(tic);

			if (err) {
				reject(err);
			} else {
				resolve({
					name,
					tagNames,
					time: toc[0] * 1e3 + toc[1] / 1e6,
				});
			}
		});
	});

	results.push(result);
}

fs.mkdirSync(path.join(__dirname, 'results'), { recursive: true });

results.sort((a, b) => a.time - b.time);
for (const { name, tagNames, time } of results) {
	fs.writeFileSync(
		path.join(__dirname, 'results', `${name}.txt`),
		`[\n${tagNames?.join(',\n') ?? ''}\n]`,
		'utf8',
	);
	console.log(`${name}: ${tagNames?.length} (${time}ms)`);
}
