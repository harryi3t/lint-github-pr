import chalk from 'chalk';

export default {
  error: function (...args) {
    console.log(chalk.bold.red(safeJSON(args)));
  },
  warn: function (...args) {
    console.log(chalk.bold.yellow(safeJSON(args)));
  },
  info: function (...args) {
    console.log(chalk.bold.green(safeJSON(args)));
  },
  debug: function (...args) {
    console.log(chalk.bold.blue(safeJSON(args)));
  }
};

function safeJSON(args) {
  var str = '';
  try {
    args.forEach(
      function (arg) {
        if (typeof arg === 'string')
          str += ' ' + arg;
        else
          str += '\n' + JSON.stringify(arg, null, 1);
      }
    );
    return str;
  } catch (err) {
    return '[object, Circular]';
  }
}
