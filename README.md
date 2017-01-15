### Lint-Github-PR
[![Travis Status][travis-badge]][travis-project]
[![Shippable Status][shippable-badge]][shippable-project]

I have created this script to help me post PR Comments using the standard
eslint config file

This may seem unnecessary as every employee must use same standard configuration. But unfortunately since this is not the case with us I had to write this. Also another reason being that I like writing automation scripts so...

### Usage
```shell
npm install lint-github-pr -g
lint-pr (github-pr-url)
```

![image][screenshot]

[screenshot]: https://cloud.githubusercontent.com/assets/5207331/21965033/7ea67164-db7d-11e6-816f-91031c46434d.png
[travis-badge]: https://travis-ci.org/harryi3t/lint-github-pr.svg?branch=master
[shippable-badge]: https://img.shields.io/shippable/587bc4f76fb9b00f0096d94b.svg?label=shippable
[shippable-project]: https://app.shippable.com/projects/587bc4f76fb9b00f0096d94b/status/dashboard
[travis-project]: https://travis-ci.org/harryi3t/lint-github-pr
