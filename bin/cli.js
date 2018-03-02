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
    capture    Capture a IR data
    play       Send a IR data
    dump       Dump written data
    write      Write a IR data from json
    temp       Get a Temperature data
    info       Show irMagician Information
    showPorts  Show device ports

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

  console.log(cli.input);

  switch (cli.input[0]) {
    case 'list':
      await irm.list();
      break;
    case 'version':
      await irm.version();
      break;
    // case 'version':
    //   irm.version();
    //   break;
    // case 'capture':
    //   irMagician.capture(cli.flags.p);
    //   break;
    // case 'play':
    //   if (cli.input[1]) {
    //     irMagician.play(cli.input[1], cli.flags.p);
    //   } else {
    //     irMagician.play(undefined, cli.flags.p);
    //   }
    //   break;
    // case 'dump':
    //   if (cli.input[1]) {
    //     irMagician.dump(cli.input[1]);
    //   } else {
    //     irMagician.dump(undefined, cli.flags.p);
    //   }
    //   break;
    // case 'write':
    //   if (cli.input[1]) {
    //     irMagician.write(cli.input[1], cli.flags.p);
    //   } else {
    //     cli.showHelp();
    //   }
    //   break;
    // case 'temp':
    //   irMagician.temp(cli.flags.p);
    //   break;
    // case 'info':
    //   irMagician.info(cli.flags.p);
    //   break;
    default:
      cli.showHelp();
      break;
  }

  irm.close();
})();
