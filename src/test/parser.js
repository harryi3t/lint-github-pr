import {parse} from '../parser.js';
import chai from 'chai';

chai.should();

const pmIssue = `
### Summary
This is a sample issue to test the script which reads the description of a github issue and opens the tasks automatically.

### Description
The application must support adding, updating and deleting a TODO.

### Scenarios
  - [ ] **1** add \`todo/new\` POST route
  - [x] **2** add \`todo/:id\` GET route
  - [ ] __3__ add \`todo/:id\` PUT route
  - [ ] **4** [www] add \`todo/:id\` DELETE route
  - [ ] **5** add \`todo\` GET route. Add support for \`sort\`, \`isEnabled\` & \`assignee\` query parameter
  - [ ] __6__ [testWWW] Add the view for TODO
  - [ ] **7** [testDocs] Update the docs for TODO`;

const userinput = {
  defaultRepo: 'testApi',
  repo: 'pm',
  owner: 'harryi3t',
  issueNumber: 1234
};

let tasks = parse(pmIssue, userinput);
let expectedTasks = [{
  owner: 'harryi3t',
  repo: 'testApi',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.1 add `todo/new` POST route',
  description: ''
}, {
  owner: 'harryi3t',
  repo: 'testApi',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.3 add `todo/:id` PUT route',
  description: ''
}, {
  owner: 'harryi3t',
  repo: 'www',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.4 add `todo/:id` DELETE route',
  description: ''
}, {
  owner: 'harryi3t',
  repo: 'testApi',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.5 add `todo` GET route',
  description: 'Add support for `sort`, `isEnabled` & `assignee` query parameter'
}, {
  owner: 'harryi3t',
  repo: 'testWWW',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.6 Add the view for TODO',
  description: ''
}, {
  owner: 'harryi3t',
  repo: 'testDocs',
  pmURL: 'https://github.com/harryi3t/pm/issues/1234',
  title: 'DEV 1234.7 Update the docs for TODO',
  description: ''
}];

describe('Parser', () => {
  it('should parse 6/7 the tasks', () => {
    tasks.length.should.be.equal(6);
  });
  tasks.forEach( (task, index) => {
    describe(`Task ${index}`, () => {
      it('should be correctly parsed', () => {
        task.should.be.deep.equal(expectedTasks[index]);
      });
    });
  });
});
