#!/usr/bin/env node

import * as commander from 'commander';
import * as bridge from './bridge'
const program = new commander.Command();

program.version('v0.0.1');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .option('-o, --output <output>', 'place the output into <file>')
  .option('-s, --show', 'show IR code to stdout')
  .option('-u, --update', 'update minits env')
  // .option('-t, --triple <triple>', 'LLVM triple')
  .action((args, opts) => bridge.build(args, opts));

program
  .command('run <file>')
  .description('compile and run ts program')
  .option('-u, --update', 'update minits env')
  // .option('-t, --triple <triple>', 'LLVM triple')
  .action((args, opts) => bridge.run(args, opts));

program
  .command('riscv <file>')
  .description('compile to riscv')
  .option('-o, --output <output>', 'place the output into <file>')
  .action((args, opts) => bridge.riscv(args, opts));

program.parse(process.argv);