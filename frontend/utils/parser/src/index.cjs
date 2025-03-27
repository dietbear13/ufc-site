// src/index.cjs

const { main } = require('./main.cjs');

// Если нужно считывать аргументы из CLI
const args = process.argv.slice(2);

main(args).catch(err => {
    console.error('Error in scraper:', err);
    process.exit(1);
});
