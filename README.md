# Nuxt Static

The fastest way to statically export your Nuxt application ⚡️

Simply run `nuxt static` for deploying your Nuxt application on [Vercel](https://vercel.com), [Netlify](https://www.netlify.com) or any CI.

## Features

- Smart re-build only if needed (ie: code changes)
- Also call `nuxt export` (or `nuxt generate` for legacy users)

## Usage

Install package:

```sh
# Using yarn
yarn add --dev @nuxt/static

# Using npm
npm i -D @nuxt/static
```

This will add a new `nuxt static` command:

```
npx nuxt static
```

This command will (re-)build project if necessary and then use `nuxt generate` or `nuxt export` based on `target` option set in `nuxt.config`.

By the first `nuxt static` run, checksum of project files will be added to `.nuxt/build.json`. When using CI/CD, you have to cache/restore `.nuxt`

### Options

You can pass extra options with `static` key in `nuxt.config`:

```js
export default {
  static: {
    ignore: [
      'docs' // ignore changes in docs to avoid re-build
    ]
  }
}
```

#### `ignore`

- Type: `string[]` or `function`

Globby patterns to ignore for snapshot. If an array is provided, it will be merged with default options, you can give a function to return an array that will remove the defaults.

You call also use the `static:ignore` hook to mutate the array (useful for modules), ex:

```js
nuxt.hook('static:ignore', (ignore) => ignore.push('content'))
```

#### `cacheDir`

- Type: `string`
- Default: `{rootDir}/node_modules/.cache/nuxt`

Overrides `buildDir`

#### `globbyOptions`

- Type: GlobbyOptions
- Default: `gitignore: true`

Additional globby options for snapshot

## Development

- Clone repostory
- Use `yarn install` to install dependencies
- Use `yarn static` to run command on test fixture

## License

[MIT License](./LICENSE)
