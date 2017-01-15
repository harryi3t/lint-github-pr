import async from 'async';
import fs from 'fs';
import prompt from 'prompt';
import parseDiff from 'parse-diff';
import GithubAdapter from 'github-adapter';
import logger from './logger';
import icons from './icons';

const userinput = {
  owner: null,
  repo: null,
  issueNumber: 0,
  defaultRepo: null
};

init();

function init() {
  const bag = {
    who: 'script',
    adapter: null,
    body: '',
    configFilePresent: false,
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
      getPR.bind(null, bag),
      parsePRDiff.bind(null, bag)
      //postComments.bind(null, bag)

    ],
    (err) => {
      if (err)
        logger.error(icons.cross, 'Completed with error: ', err);
    }
  );
}

function parsePullRequestURL(bag, next) {
  const pullRequestUrl = process.argv[2];
  const validNameRegexp = '[a-zA-Z0-9-.]+';
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

function getPR(bag, next) {
  const who = `${bag.who} | ${getPR.name}`;
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

      bag.body = data;
      return next();
    }
  );
}

function parsePRDiff(bag, next) {
  const who = `${bag.who} | ${parsePRDiff.name}`;
  logger.debug(`>Inside ${who}`);

  let files = parseDiff(bag.body);
  console.log(files);
  files.forEach(
    (file) => {
      console.log(file.to,'------------------------------');
      // file.chunks.forEach(
      //   (chunk) => {
      //     console.log('---------------');
      //     console.log(chunk);
      //   }
      // );
    }
  );

  return next();
}

function postComments(bag, next) {
  const who = `${bag.who} | ${postComments.name}`;
  logger.debug(`>Inside ${who}`);

  var lines = [27];

  async.each(lines,
    function (line, nextLine) {
      bag.adapter.postPRComment('harryi3t','5136','2',
        {
          'body': 'comment on position '+line,
          'commit_id': '0f4f64c184a68b8a6fc4d4ea8b4131c909ed217a',
          'path': 'shippable.yml',
          'position': line
        },
        function (err, comment) {
          console.log('comment ', comment);
        }
      );
      return nextLine();
    },
    function () {
      return next();
    }
  );
}
