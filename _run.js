const Benchmark = require('./index.js');
const ProgressBar = require('progress');

process.on('uncaughtException', (e) => {
	console.error(e);
	process.exit(1);
});

process.on('message', async (item) => {
	const bar = new ProgressBar('[:bar] :current / :total', {
		total: Benchmark.TOTAL,
		complete: '=',
		incomplete: ' ',
		width: 50,
	});

	const parser = await import(item.parser);
	const bench = new Benchmark(parser.default);

	bench.on('progress', () => {
		bar.tick();
	});

	bench.once('result', (stat) => {
		process.send({
			mean: stat.mean(),
			sd: stat.sd(),
		});
		process.exit(0);
	});
});
