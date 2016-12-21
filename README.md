### GithubIO: Github Issue Opener
[![Travis Status][travis-badge]][travis-project]
[![Shippable Status][shippable-badge]][shippable-project]

I have created this script to help me open issues automatically in appropriate repositories after reading the details from a so called `PM Issue`.

The supported syntax for the `PM Issue` is like this
```
 - [ ] **1** Task 1 title. Task 1 Description
 - [ ] **2** [repo1] Task 2 title. Task 2 Description
 - [ ] **3** [repo2] Task 3 title. Task 3 Description
 ...
```

### Usage
```
git clone git@github.com:harryi3t/githubIO.git
cd githubIO
yarn // or npm install
npm start (PM Issue URL) (Default Repo)
```

### Example
For the following sample `PM Issue: https://github.com/orgName/pmRepoName/issues/1234`
```
### Summary
Create a `TODO` application

### Description
The application must support adding, updating and deleting a TODO.

### Scenarios
  - [ ] **1** add `todo/new` POST route
  - [ ] **2** add `todo/:id` GET route
  - [ ] **3** add `todo/:id` PUT route
  - [ ] **4** add `todo/:id` DELETE route
  - [ ] **5** add `todo` GET route. Add support for `sort`, `isEnabled` & `assignee` query parameter
  - [ ] **6** [wwwRepo] Add the view for TODO
  - [ ] **7** [docsRepo] Update the docs for TODO
```
And following Usage
```
npm start https://github.com/orgName/pmRepoName/issues/1234 testApiRepo
```

#### Following tasks will be opened in https://github.com/orgName/testApiRepo
The value `testApiRepo` is taken from the default repo value passed to the script
  - __Title__: `DEV 1234.1 add `todo/new` POST route` __Description__: Link to PM Issue
  - __Title__: `DEV 1234.2 add `todo/:id` GET route` __Description__: Link to PM Issue
  - __Title__: `DEV 1234.3 add `todo/:id` PUT route` __Description__: Link to PM Issue
  - __Title__: `DEV 1234.4 add `todo/:id` DELETE route` __Description__: Link to PM Issue
  - __Title__: `DEV 1234.5 add `todo` GET route.` __Description__ Link to PM Issue, `Add support for sort, isEnabled & assignee query parameter`

#### Following tasks will be opened in https://github.com/orgName/wwwRepo
The value `wwwRepo` from the description has overridden the default repo value
  - __Title__: `DEV 1234.6 [www] Add the view for TODO`

#### Following tasks will be opened in https://github.com/orgName/docsRepo
The value `docsRepo` from the description has overridden the default repo value
  - __Title__: `DEV 1234.7 [docs] Update the docs for TODO`

![image][screenshot]

[screenshot]: https://cloud.githubusercontent.com/assets/5207331/21080518/35d4bd40-bfd7-11e6-9a46-48ed08779fa6.png
[travis-badge]: https://travis-ci.org/harryi3t/githubIO.svg?branch=master
[shippable-badge]: https://img.shields.io/shippable/584d675f938d4210003b61db.svg?label=shippable
[shippable-project]: https://app.shippable.com/projects/584d675f938d4210003b61db/status/dashboard
[travis-project]: https://travis-ci.org/harryi3t/githubIO
