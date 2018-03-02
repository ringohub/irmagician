#! /usr/bin/env node
const meow = require('meow');
const IRMagician = require('../lib/irMagician');

const flags = {
  port: {
    type: 'boolean',
    alias: 'p',
    description: 'List Ports'
  },
  version: {
    type: 'boolean',
    alias: 'v',
    description: 'Display version'
  }
};

const commands = {};

const cmd = process.argv[1].split('/').reverse()[0];
const helpOptions = Object.keys(flags).map(f => {
  // Generate option documents. Example...
  //     -v, --version  Display version
  //     -h, --help     Display help
  return `    -${flags[f].alias}, --${f}\t${flags[f].description}`;
}).join('\n');

const cli = meow(`
Usage: ${cmd} <command> [file] 

Command
    list       List serial ports
    version    Display IRMagichian's version

Options
${helpOptions}

Examples
    ${cmd} capture
    ${cmd} dump data.json
    ${cmd} write data.json
`, flags);

(async () => {
  const irm = await new IRMagician().catch(e => {
    console.error(e.message)
  });

  switch (cli.input[0]) {
    case 'temp':
      await irm.temp();
      break;
    case 'info':
      await irm.info();
      break;
    case 'list':
      await irm.list();
      break;
    case 'version':
      await irm.version();
      break;
    //
    default:
      cli.showHelp();
      break;
  }

  irm.close();
})();
