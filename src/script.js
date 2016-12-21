import _ from 'underscore';
import async from 'async';
import fs from 'fs';
import GithubAdapter from './Adapter.js';
import logger from './logger.js';
import prompt from 'prompt';
import {parse} from './parser';
import icons from './icons';

var githubUrl = 'https://github.com';
var userinput = {
  owner: null,
  repo: null,
  issueNumber: 0,
  defaultRepo: null
};

init();

function init() {
  var bag = {
    who: 'script',
    adapter: null,
    body: '',
    tasks: [],
    configFilePresent: false,
    userinput: userinput
  };
  logger.info(`>Starting ${bag.who}`);
  async.series(
    [
      _parsePMIssue.bind(null, bag),
      _checkConfigFile.bind(null, bag),
      _createConfigFile.bind(null, bag),
      _checkToken.bind(null, bag),
      _initializeAdapter.bind(null, bag),
      _getIssue.bind(null, bag),
      _parseBody.bind(null, bag),
      _createIssues.bind(null, bag)
    ],
    function (err) {
      if (err)
        logger.error(icons.cross, 'Completed with error: ', err);
    }
  );
}

function _parsePMIssue(bag, next) {
  var pmIssueUrl = process.argv[2];
  var defaultRepo = process.argv[3];
  var validNameRegexp = '[a-zA-Z0-9\-\._]+';
  var urlRegex = new RegExp(`https?://github.com/(${validNameRegexp})/` +
    `(${validNameRegexp})/issues/([0-9]+)`);
  var urlMatch = pmIssueUrl.match(urlRegex);

  if (!pmIssueUrl)
    return next('Please pass the PM issue URL as the 1st argument');
  if (!urlMatch)
    return next(`Invalid URL`);
  if (!defaultRepo)
    return next('Please pass the default repo to open issues as 2nd argument');
  if (!defaultRepo.match(new RegExp(`^${validNameRegexp}$`)))
    return next('Invalid default repo. Found Invalid characters');

  bag.userinput.owner = urlMatch[1];
  bag.userinput.repo = urlMatch[2];
  bag.userinput.issueNumber = urlMatch[3];
  bag.userinput.defaultRepo = defaultRepo;

  return next();
}

function _checkConfigFile(bag, next) {
  var who = `${bag.who} | ${_checkConfigFile.name}`;
  logger.debug(`>Inside ${who}`);

  var requiredPermissions = fs.constants.R_OK | fs.constants.W_OK
    | fs.constants.W_OK;
  fs.access('.config.json', requiredPermissions, (err) => {
    if (err)
      logger.warn('.config.json file not found');
    else
      bag.configFilePresent = true;

    return next();
  });
}

function _createConfigFile(bag, next) {
  var who = `${bag.who} | ${_createConfigFile.name}`;

  if (bag.configFilePresent) {
    who += ' skipped'
    logger.debug(`>Inside ${who}`);
    return next();
  }
  logger.debug(`>Inside ${who}`);

  __getTokenFromInput((token) => {
    logger.debug('Saving token to file .config.json ...');

    var fileToWrite = JSON.stringify({
      githubToken: token
    }, null, 2);

    fs.writeFile('.config.json', fileToWrite, (err) => {
      if (err)
        return next(`Error writing token to file .config.json: ${err}`);

      bag.configFilePresent = true;
      logger.info('token saved in .config.json!');
      return next();
    });
  });
}
function __getTokenFromInput(next) {
  logger.info('Please enter your github token');
  prompt.start();
  prompt.get('github token', (err, result) => {
    var token = result['github token'];
    if (err) return;
    __validateToken(token, (err) => {
      if (err) {
        logger.warn(err);
        __getTokenFromInput(next);
      }

      return next(null, token);
    })
  });
}
function __validateToken(token, next) {
  if (!token || typeof token !== 'string')
    return next(`Token not found`);
  else if (token.length !== 40)
    return next(`Invalid token. Must be of length 40, ` +
      `but found length ${token.length}`);
  else if (!token.match(/[a-z0-9]{40}/))
    return next(`Invalid characters found in the token`);
  else
    return next();
}

function _checkToken(bag, next) {
  var who = `${bag.who} | ${_checkToken.name}`;
  logger.debug(`>Inside ${who}`);

  fs.readFile('.config.json', 'utf8', (err, strData) => {
    if (err) return next(err);

    try {
      var jsonData = JSON.parse(strData);
      bag.token = jsonData.githubToken;
    } catch (err) {
      return next('the content of .config.json file in not a valid JSON');
    }

    __validateToken(bag.token, next);
  });
}

function _initializeAdapter(bag, next) {
  var who = `${bag.who} | ${_initializeAdapter.name}`;
  logger.debug(`>Inside ${who}`);

  bag.adapter = new GithubAdapter(bag.token);
  return next();
}

function _getIssue(bag, next) {
  var who = `${bag.who} | ${_getIssue.name}`;
  logger.debug(`>Inside ${who}`);

  bag.adapter.getIssue(bag.userinput.owner, bag.userinput.repo,
    bag.userinput.issueNumber,
    function (err, data) {
      if (err) return next(err);

      console.log(data.body);
      bag.body = data.body;
      return next();
    }
  );
}

function _parseBody(bag, next) {
  var who = `${bag.who} | ${_parseBody.name}`;
  logger.debug(`>Inside ${who}`);
  bag.tasks = parse(bag.body, bag.userinput);
  console.log(`\n${bag.tasks.length} task(s) parsed`);
  bag.tasks.forEach((task) => task.print());
  return next();
}

function _createIssues(bag, next) {
  var who = `${bag.who} | ${_createIssues.name}`;
  logger.debug(`>Inside ${who}`);
  var error = '';

  async.each(bag.tasks,
    function (task, nextTask,) {
      var delay = bag.tasks.indexOf(task) * 50;
      // to open issues in series, without using async.series
      // this is much faster than using async.series
      setTimeout(() => {
        bag.adapter.postIssue(task.owner, task.repo, task.getIssue(),
          function (err, obj) {
            if (!err)
              logger.info(icons.check, task.title);
            else {
              logger.error(icons.cross, task.title);
              logger.error('  ', `Repo not found ${task.owner}/${task.repo}`);
              error = `Some repo(s) not found`;
            }

            return nextTask();
          }
        );
      },delay);
    },
    function (err) {
      return next(error);
    }
  );
}
