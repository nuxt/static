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

    ]
  }
}
```

#### `ignore`

- Type: `string[]`

Globby patterns to ignore for snapshot

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
