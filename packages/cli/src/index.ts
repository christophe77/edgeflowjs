#!/usr/bin/env node

import { Command } from "commander";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";
import { simulateCommand } from "./commands/simulate.js";
import { deployCommand } from "./commands/deploy.js";
import { logsCommand } from "./commands/logs.js";
import { updateCommand } from "./commands/update.js";
import { doctorCommand } from "./commands/doctor.js";
import { killPortsCommand } from "./commands/killPorts.js";

const program = new Command();

program
  .name("edgeflow")
  .description("EdgeFlow CLI — build, deploy, and maintain industrial kiosks")
  .version("0.1.0");

program.addCommand(devCommand());
program.addCommand(buildCommand());
program.addCommand(simulateCommand());
program.addCommand(deployCommand());
program.addCommand(logsCommand());
program.addCommand(updateCommand());
program.addCommand(doctorCommand());
program.addCommand(killPortsCommand());

program.parse();
