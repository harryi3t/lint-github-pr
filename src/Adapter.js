import async from 'async';
import parseLinks from 'parse-links';
import request from 'request';
import util from 'util';
// import logger from './logger';

const url = 'https://api.github.com';
const self = Adapter;

export default function Adapter(token) {
  this.token = token;
  this.baseUrl = url;
}

Adapter.prototype.get = function get(relativeUrl, callback) {
  const opts = {
    method: 'GET',
    url: relativeUrl.indexOf('http') === 0 ? relativeUrl : this.baseUrl +
    relativeUrl,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'token ' + this.token,
      'User-Agent': 'Shippable API',
      'Accept': 'application/vnd.GithubProvider.v3'
    }
  };

  let bag = {
    opts: opts,
    relativeUrl: relativeUrl,
    token: this.token
  };

  bag.who = util.format('common|github|%s|GET|url:%s', self.name, relativeUrl);

  async.series([
    _performCall.bind(null, bag),
    _parseResponse.bind(null, bag)
  ], function () {
    callback(bag.err, bag.parsedBody, bag.headerLinks, bag.res);
  });
};

Adapter.prototype.post = function post(relativeUrl, json, callback) {
  const opts = {
    method: 'POST',
    url: this.baseUrl + relativeUrl,
    followAllRedirects: true,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'token ' + this.token,
      'User-Agent': 'Shippable v3',
      'Accept': 'application/vnd.GithubProvider.v3'
    },
    json: json
  };
  let bag = {
    opts: opts,
    relativeUrl: relativeUrl,
    token: this.token
  };

  bag.who = util.format('common|github|%s|POST|url:%s', self.name,
    relativeUrl);

  async.series([
    _performCall.bind(null, bag),
    _parseResponse.bind(null, bag)
  ], function () {
    callback(bag.err, bag.parsedBody, bag.headerLinks, bag.res);
  });
};

Adapter.prototype.put = function put(relativeUrl, json, callback) {
  const opts = {
    method: 'PUT',
    url: this.baseUrl + relativeUrl,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'token ' + this.token,
      'User-Agent': 'Shippable v3',
      'Accept': 'application/vnd.GithubProvider.v3'
    },
    json: json
  };
  let bag = {
    opts: opts,
    relativeUrl: relativeUrl,
    token: this.token
  };

  bag.who = util.format('common|github|%s|PUT|url:%s', self.name, relativeUrl);

  async.series([
    _performCall.bind(null, bag),
    _parseResponse.bind(null, bag)
  ], function () {
    callback(bag.err, bag.parsedBody, bag.headerLinks, bag.res);
  });
};

Adapter.prototype.del = function del(relativeUrl, callback) {
  const opts = {
    method: 'DELETE',
    url: this.baseUrl + relativeUrl,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'token ' + this.token,
      'User-Agent': 'Shippable v3',
      'Accept': 'application/vnd.GithubProvider.v3'
    }
  };

  let bag = {
    opts: opts,
    relativeUrl: relativeUrl,
    token: this.token
  };

  bag.who = util.format('common|github|%s|DELETE|url:%s', self.name,
    relativeUrl);

  async.series([
    _performCall.bind(null, bag),
    _parseResponse.bind(null, bag)
  ], function () {
    callback(bag.err, bag.parsedBody, bag.res);
  });
};

// common helper methods
function _performCall(bag, next) {
  let who = bag.who + '|' + _performCall.name;

  bag.startedAt = Date.now();
  request(bag.opts, function (err, res, body) {
    let interval = Date.now() - bag.startedAt;

    bag.res = res;
    bag.body = body;
    if (res && res.statusCode > 299) err = err || res.statusCode;
    if (err) {
      bag.err = err;
    }
    next();
  });
}

function _parseResponse(bag, next) {
  let who = bag.who + '|' + _parseResponse.name;

  if (bag.res && bag.res.headers.link) {
    bag.headerLinks = parseLinks(bag.res.headers.link);
  }

  if (bag.body) {
    if (typeof bag.body === 'object') {
      bag.parsedBody = bag.body;
    } else {
      try {
        bag.parsedBody = JSON.parse(bag.body);
      } catch (e) {
        bag.err = e;
      }
    }
  }
  next();
}

Adapter.prototype.getRateLimit = function getRateLimit(callback) {
  this.get('/rate_limit', callback);
};

Adapter.prototype.getCurrentUser = function getCurrentUser(callback) {
  this.get('/user', callback);
};

Adapter.prototype.postIssue = function postIssue(owner, repo, body, callback) {
  let allIssues = [];
  let self = this;
  let url = '/repos/' + owner + '/' + repo +'/issues';
  this.post(url, body, callback);
};

Adapter.prototype.getIssue = function getIssue(owner, repo, number, callback) {
  let allIssues = [];
  let self = this;
  let url = '/repos/' + owner + '/' + repo +'/issues/' + number;
  this.get(url, callback);
};
