# Welcome to custom-wa-wrapper 👋
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![Prerequisite](https://img.shields.io/badge/node-12.16.1-blue.svg)
![Prerequisite](https://img.shields.io/badge/npm-6.13.4-blue.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> Custom Wrapper to Watson Assistant to interact with Watson Openscale

## Prerequisites

- node 12.16.1
- npm 6.13.4


## How to run locally

1. Install the dependencies.

```sh
npm install
```

2. Add the following environment variables:
* **WATSON_ASSISTANT_API_URL** [your watson assistant api url]
* **WATSON_ASSISTANT_APIKEY**: [your watson assistant api key]
* **WATSON_ASSISTANT_ID**: [your watson assistant id]

3. Start the server

```sh
npm start
```

## Deploy in IBM Cloud

1. Copy the contents of `manifest.yml.tmp` to `manifest.yml`
2. Add the following values in the config file:
* **WATSON_ASSISTANT_API_URL** [your watson assistant api url]
* **WATSON_ASSISTANT_APIKEY**: [your watson assistant api key]
* **WATSON_ASSISTANT_ID**: [your watson assistant id]
3. Deploy using `ibmcloud` cli.

## Author

👤 **Prem Piyush Goyal**

* Github: [@prempiyush](https://github.com/prempiyush)
* LinkedIn: [@prempiyush](https://linkedin.com/in/prempiyush)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_