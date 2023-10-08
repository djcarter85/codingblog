---
title: "Commit hash using React and AWS Amplify"
summary: "Something I found out how to do today." 
---

Context:

- A [React](https://reactjs.org/) app in a Git repository.
- [AWS Amplify](https://aws.amazon.com/amplify/console/) set up to automatically
  build and deploy your app when changes are made.

Suppose you want to display the hash of the commit where the app was built,
perhaps on an about page or in the footer.

## How?

Follow these steps:

### 1. Modify the build script

- Go to the AWS Amplify console.
- Click on "App settings" > "Build settings".
- Under "App build specification", click "Edit".
- Change the build command from `npm run build` to
  `REACT_APP_COMMIT_ID=$AWS_COMMIT_ID npm run build`.

### 2. Read the value in your app

- Read the value using `process.env.REACT_APP_COMMIT_ID`, for example:
  `<p>Commit ID: {process.env.REACT_APP_COMMIT_ID}</p>`

### 3. Set up the value in development

- Add a file in the root of the project called `.env.development`.
- Add a development version of the variable, e.g. `REACT_APP_COMMIT_ID=abcdef`.

## Why?

In the above, `REACT_APP_COMMIT_ID` is the name of an environment variable to be
used at build time ([more
details](https://create-react-app.dev/docs/adding-custom-environment-variables/)).
It's important that its name starts with `REACT_APP`, as otherwise React won't
be able to see its value (this is a security feature to avoid accidentally
exposing secrets).

In part 1, we set its value to `$AWS_COMMIT_ID`. This is a reference to an
Amplify build-time environment variable containing the hash of the commit being
built. There are a number of environment variables automatically set by Amplify
([see
here](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html#amplify-console-environment-variables)),
and you can even set your own ([see
here](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html#setting-env-vars)).
