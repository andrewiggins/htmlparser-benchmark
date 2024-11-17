import fs from 'node:fs';
import path from 'node:path';
import Benchmark from './index.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const p = (...args) => path.join(__dirname, ...args);

const wrappers = fs
	.readdirSync(path.join(__dirname, 'wrapper'))
	.map((filename) => ({
		name: path.basename(filename, '.js'),
		parser: path.join(__dirname, 'wrapper', filename),
	}))
	.filter(
		({ name }) =>
			// name === 'htmljs-parser' || // Doesn't parse the entire file eagerly
			// name.includes('streaming') ||
			name === 'streaming.exp.mts' ||
			// name === 'tl' || // Has parsing bugs such as <script>'<strong>'</script>
			name === 'htmlparser2' ||
			name === 'neutron-html5parser' ||
			name === 'html5parser' ||
			// name === 'node-html-parser' || Messed up badly on 0475e5eeadaaca857eea3f36d0eda01937fe672d48be7f98ba6bc7f25ecd63d0
			name === 'parse5', // Applies HTML semantics to the document and inserts spec-required elements
	);

const FILES = Benchmark.FILES;
// const FILES = [
// 	{
// 		key: 'b7660c4d40274010176c79271f7ed0c2d4612fa2a68efb92b30cfe68cc400e5e',
// 		file: p(
// 			'files/b7660c4d40274010176c79271f7ed0c2d4612fa2a68efb92b30cfe68cc400e5e.html',
// 		),
// 	},
// 	{
// 		key: '0475e5eeadaaca857eea3f36d0eda01937fe672d48be7f98ba6bc7f25ecd63d0',
// 		file: p(
// 			'files/0475e5eeadaaca857eea3f36d0eda01937fe672d48be7f98ba6bc7f25ecd63d0.html',
// 		),
// 	},
// 	{
// 		key: '06ed0a833361190536a4f61888354e07dccaa501bd9a1c0f1c545533bde1650b',
// 		file: p(
// 			'files/06ed0a833361190536a4f61888354e07dccaa501bd9a1c0f1c545533bde1650b.html',
// 		),
// 	},
// ];

/**
 * @typedef {{file: string; library: string; tagNames: string[]; time: number; }} Result
 * @type {Record<string, Result[]>}
 */
const results = {};

for (const { key, file } of FILES) {
	const html = fs.readFileSync(file, 'utf8');

	for (const { name: library, parser } of wrappers) {
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
						library,
						file: key,
						tagNames,
						time: toc[0] * 1e3 + toc[1] / 1e6,
					});
				}
			});
		});

		(results[key] ??= []).push(result);
	}
}

fs.mkdirSync(p('results'), { recursive: true });
Object.keys(results).forEach((library) =>
	fs.mkdirSync(p(`results/${library}`), { recursive: true }),
);

// results.sort((a, b) => a.time - b.time);

for (const file of Object.keys(results).sort()) {
	const fileResults = results[file];
	const allEqual = fileResults.every(
		({ tagNames }) => tagNames.length === fileResults[0].tagNames.length,
	);

	if (!allEqual) {
		console.log();
		console.log(file);
		for (const { library, tagNames, time } of fileResults) {
			fs.writeFileSync(
				p(`results/${file}/${library}.json`),
				`[\n${tagNames?.map((n) => `"${n}"`)?.join(',\n') ?? ''}\n]`,
				'utf8',
			);

			console.log(`${file}: ${tagNames?.length} ${library} (${time}ms)`);
		}
	}
}
