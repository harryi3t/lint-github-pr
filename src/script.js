#!/usr/bin/env node

import async from 'async';
import chalk from 'chalk';
import fs from 'fs';
import prompt from 'prompt';
import parseDiff from 'parse-diff';
import {CLIEngine} from 'eslint';
import GithubAdapter from 'github-adapter';
import logger from './logger';
import lintConfig from '../lintConfig';

const userinput = {
  owner: null,
  repo: null,
  issueNumber: 0,
  defaultRepo: null
};
const validNameRegexp = '[a-zA-Z0-9-.]+';

function convertRawUrl(url) {
  var exp = new RegExp(`https?:\/\/github.com\/(${validNameRegexp}\/${validNameRegexp})\/raw\/([a-z0-9]{40}\/.*)`);
  var match = url.match(exp);
  if (match && match.length === 3) {
    var ownerAndRepo = match[1];
    var shaAndFile = match[2];
    return `https://raw.githubusercontent.com/${ownerAndRepo}/${shaAndFile}`;
  }
}

init();

function init() {
  const bag = {
    who: 'script',
    adapter: null,
    body: '',
    configFilePresent: false,
    commitID: '',
    diffFiles: [],
    lineNumberMap: {},
    tasks: [],
    token: null,
    userinput
  };
  Object.seal(bag);
  logger.info(`>Starting ${bag.who}`);
  async.series(
    [
      parsePullRequestURL.bind(null, bag),
      checkConfigFile.bind(null, bag),
      createConfigFile.bind(null, bag),
      checkToken.bind(null, bag),
      initializeAdapter.bind(null, bag),
      getPRFiles.bind(null, bag),
      getCompleteFiles.bind(null, bag),
      getPRDiff.bind(null, bag),
      lintEachFileInDiff.bind(null, bag),
      postComments.bind(null, bag)
    ],
    (err) => {
      if (err)
        logger.error('✗ Completed with error: ', err);
    }
  );
}

function parsePullRequestURL(bag, next) {
  const pullRequestUrl = process.argv[2];
  const urlRegex = new RegExp(`https?://github.com/(${validNameRegexp})/` +
    `(${validNameRegexp})/pull/([0-9]+)(/|/files)?$`);

  if (!pullRequestUrl)
    return next('Please pass the PR URL as the 1st argument');

  const urlMatch = pullRequestUrl.match(urlRegex);
  if (!urlMatch) return next('Invalid URL');

  bag.userinput.owner = urlMatch[1];
  bag.userinput.repo = urlMatch[2];
  bag.userinput.issueNumber = urlMatch[3];

  return next();
}
function checkConfigFile(bag, next) {
  const who = `${bag.who} | ${checkConfigFile.name}`;
  logger.debug(`>Inside ${who}`);

  // eslint-disable-next-line no-bitwise
  const requiredPermissions = fs.constants.ROK | fs.constants.WOK
    | fs.constants.WOK;
  fs.access('.config.json', requiredPermissions, (err) => {
    if (err)
      logger.warn('.config.json file not found');
    else bag.configFilePresent = true;

    return next();
  });
}
function createConfigFile(bag, next) {
  let who = `${bag.who} | ${createConfigFile.name}`;

  if (bag.configFilePresent) {
    who += ' skipped';
    logger.debug(`>Inside ${who}`);
    return next();
  }
  logger.debug(`>Inside ${who}`);

  getTokenFromInput((token) => {
    logger.debug('Saving token to file .config.json ...');

    const fileToWrite = JSON.stringify({
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
function getTokenFromInput(next) {
  logger.info('Please enter your github token');
  prompt.start();
  prompt.get('github token', (err, result) => {
    const token = result['github token'];
    if (err) return;
    validateToken(token, (err) => {
      if (err) {
        logger.warn(err);
        getTokenFromInput(next);
      }

      return next(null, token);
    });
  });
}
function validateToken(token, next) {
  if (!token || typeof token !== 'string')
    return next('Token not found');
  else if (token.length !== 40) {
    return next('Invalid token. Must be of length 40, ' +
      `but found length ${token.length}`);
  } else if (!token.match(/[a-z0-9]{40}/))
    return next('Invalid characters found in the token');
  else
    return next();
}
function checkToken(bag, next) {
  const who = `${bag.who} | ${checkToken.name}`;
  logger.debug(`>Inside ${who}`);

  fs.readFile('.config.json', 'utf8', (err, strData) => {
    if (err) return next(err);

    let jsonData = null;
    try {
      jsonData = JSON.parse(strData);
    } catch (err) {
      return next('the content of .config.json file in not a valid JSON');
    }
    bag.token = jsonData.githubToken;
    validateToken(bag.token, next);
  });
}
function initializeAdapter(bag, next) {
  const who = `${bag.who} | ${initializeAdapter.name}`;
  logger.debug(`>Inside ${who}`);

  bag.adapter = new GithubAdapter(bag.token);
  return next();
}
function getPRFiles(bag, next) {
  const who = `${bag.who} | ${getPRFiles.name}`;
  logger.debug(`>Inside ${who}`);

  bag.adapter.getPRFiles(bag.userinput.owner, bag.userinput.repo,
    bag.userinput.issueNumber,
    (err, data) => {
      if (err) {
        if (err === 404)
          return next(`404: ${bag.userinput.owner}/${bag.userinput.repo}/` +
            `pull/${bag.userinput.issueNumber} does not exists`);
        return next(err);
      }
      bag.diffFiles = data.filter(
        function (file) {
          return file.filename.slice(-3) === '.js';
        }
      );

      if (bag.diffFiles.length === 0) {
        return next('No JS file in the PR');
      }

      var match = bag.diffFiles[0].raw_url.match(/raw\/([a-z0-9]{40})\//);
      if (match && match.length === 2)
        bag.commitID = match[1];

      if (!bag.commitID)
        return next('Could not get commitId');

      var fileNames = bag.diffFiles.map(
        function (file) {
          return file.filename;
        }
      );
      logger.info(`Total files found in PR: ${data.length}\n` +
        ` Total JS files: ${bag.diffFiles.length} (${fileNames.join(', ')})`);
      return next();
    }
  );
}
function getCompleteFiles(bag, next) {
  const who = `${bag.who} | ${getCompleteFiles.name}`;
  logger.debug(`>Inside ${who}`);

  async.each(bag.diffFiles,
    function (file, nextFile) {
      file.raw_url = convertRawUrl(file.raw_url);
      bag.adapter.getRawContent(file.raw_url,
        function (err, data) {
          if (err) {
            if (err === 404)
              return nextFile(`404: ${file.raw_url}`);
            return nextFile(err);
          }

          file.raw = data;
          return nextFile();
        }
      );
    },
    function (err) {
      return next(err);
    }
  );
}
function getPRDiff(bag, next) {
  const who = `${bag.who} | ${getPRDiff.name}`;
  logger.debug(`>Inside ${who}`);

  bag.adapter.getPRDiff(bag.userinput.owner, bag.userinput.repo,
    bag.userinput.issueNumber,
    (err, data) => {
      if (err) {
        if (err === 404)
          return next(`404: ${bag.userinput.owner}/${bag.userinput.repo}/` +
            `pull/${bag.userinput.issueNumber} does not exists`);
        return next(err);
      }

      var parsedFiles = parseDiff(data);
      parsedFiles.forEach(
        function (file) {
          var del = 0;
          var relativeLine = 0;
          bag.lineNumberMap[file.to] = {};
          file.chunks.forEach(
            function (chunk, index) {
              if (index !== 0)
                relativeLine++;
              chunk.changes.forEach(
                function (change) {
                  relativeLine++;
                  bag.lineNumberMap[file.to][change.ln || change.ln2] =
                    relativeLine + del;
                }
              );
            }
          );
        }
      );

      return next();
    }
  );
}
function lintEachFileInDiff(bag, next) {
  const who = `${bag.who} | ${lintEachFileInDiff.name}`;
  logger.debug(`>Inside ${who}`);

  var cli = new CLIEngine({
    useEslintrc: false,
    baseConfig: lintConfig
  });

  bag.diffFiles.forEach(
    function (file) {
      file.messages = [];
      file.skippedMessages = 0;
      file.lintMessages = [];
      var report = cli.executeOnText(file.raw, file.filename);

      logger.debug(`\n${file.filename} (${report.results[0].messages.length})`);

      report.results[0].messages.forEach(
        function (obj) {
          var consoleMessage = '';

          if (!bag.lineNumberMap[file.filename][obj.line]) {
            consoleMessage = chalk.dim.yellow(chalk.dim(obj.ruleId) +
              ': ' + obj.line) + ' ' + chalk.dim.red(obj.message);

            file.messages.push({
              shouldSkip: true,
              consoleMessage: consoleMessage
            });

            file.skippedMessages++;
            return;
          }

          consoleMessage = chalk.yellow(chalk.bold(obj.ruleId) +
            ': ' + obj.line) + ' ' + chalk.red(obj.message);
          var prComment = {
            body: `\`${obj.ruleId}\`: ${obj.message}`,
            commit_id: bag.commitID,
            path: file.filename,
            position: bag.lineNumberMap[file.filename][obj.line]
          };

          file.messages.push({
            consoleMessage: consoleMessage,
            prComment: prComment
          });
        }
      );
    }
  );
  return next();
}
function postComments(bag, next) {
  const who = `${bag.who} | ${postComments.name}`;
  logger.debug(`>Inside ${who}`);

  async.eachSeries(bag.diffFiles,
    function (file, nextFile) {
      logger.info(`\n${file.filename}: (${file.messages.length})`);

      async.each(file.messages,
        function (mesg, nextMesg) {
          if (mesg.shouldSkip) {
            console.log(chalk.yellow(' ► ') + mesg.consoleMessage);
            return nextMesg();
          }
          bag.adapter.postPRComment(bag.userinput.owner, bag.userinput.repo,
            bag.userinput.issueNumber, mesg.prComment,
            function (err) {
              if (err) {
                console.log(chalk.bold.red(' ✗ ') + mesg.consoleMessage);
                if (err === 403)
                  return nextMesg('403: You have triggered an abuse detection' +
                    'mechanism and have been temporarily blocked from content' +
                    'creation. Please retry your request again later.');
              }
              else
                console.log(chalk.bold.green(' ✓ ') + mesg.consoleMessage);
              return nextMesg();
            }
          );
        },
        function (err) {
          if (file.skippedMessages)
            logger.info(`Skipped ${file.skippedMessages} ` +
              'messages as were out of scope of this PR');
          return nextFile(err);
        }
      );
    },
    function (err) {
      return next(err);
    }
  );
}
