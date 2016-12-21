import chalk from 'chalk';
const githubUrl = 'https://github.com';

export default class Task {
  constructor(userinput, number, title, repo, description) {
    this.owner = userinput.owner;
    this.repo = repo;
    this.pmURL = `${githubUrl}/${this.owner}/${userinput.repo}/issues/${userinput.issueNumber}`;
    this.title = `DEV ${userinput.issueNumber}.${number} ${title}`;
    this.description = description;
  }
  getIssue() {
    return {
      title: this.title,
      body: `${this.pmURL}\n\n${this.description}`
    };
  }
  print() {
    var issue = this.getIssue();
    console.log(
      chalk.blue.bold.underline(`${this.owner}/${this.repo}: `),
      chalk.blue.bold(issue.title)
    );
    issue.body.split('\n').forEach( (line) => {
      if (line)
        console.log('  ',
          chalk.green.bold(line)
        );
    })
  }
}
