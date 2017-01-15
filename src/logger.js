import chalk from 'chalk';

export default {
  error(...args) {
    console.log(chalk.bold.red(safeJSON(args)));
  },
  warn(...args) {
    console.log(chalk.bold.yellow(safeJSON(args)));
  },
  info(...args) {
    console.log(chalk.bold.green(safeJSON(args)));
  },
  debug(...args) {
    console.log(chalk.bold.blue(safeJSON(args)));
  },
};

function safeJSON(args) {
  let str = '';
  try {
    args.forEach(
      (arg) => {
        if (typeof arg === 'string')
          str += ` ${arg}`;
        else
          str += `\n${JSON.stringify(arg, null, 1)}`;
      },
    );
    return str;
  } catch (err) {
    return '[object, Circular]';
  }
}
