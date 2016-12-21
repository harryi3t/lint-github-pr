import logger from './logger';
import Task from './Task';

export function parse(text, userinput) {
  let tasks = [];
  const listRegex = '- \\[ \\]';
  const numberRegex1 = '\\*\\*([0-9])\\*\\*';
  const numberRegex2 = '__([0-9])__';
  const numberRegex = `(${numberRegex1}|${numberRegex2})`;
  const repoRegex = '(\\[([a-zA-Z0-9\.-_]+)\\] )?';
  const titleAndDescRegex = '([^.]+).? ?(.+)?';
  const regexp = new RegExp(`${listRegex} ${numberRegex} ${repoRegex}${titleAndDescRegex}`);
  text.split('\n').forEach( (line, index) => {
    const match = line.match(regexp)
    if (match && match.length === 8) {
      const issueNumber = match[2] || match[3];
      const repo = match[5] || userinput.defaultRepo;
      const title = match[6];
      const desc = match[7] || '';
      var newTask = new Task(userinput, issueNumber, title, repo, desc);
      tasks.push(newTask);
    }
  });
  return tasks;
}
