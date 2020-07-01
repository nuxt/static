# Nuxt Static

## Usage

```
npx nuxt static
```

This command will (re-)build project if necessary and then use `nuxt generate` or `nuxt export` based on `target` option set in `nuxt.config`.

By the first `nuxt static` run, checksum of project files will be added to `.nuxt/build.json`. When using CI/CD, you have to cache/restore `.nuxt` (or custom `buildDir` if used)

## Installation

Using yarn:

```
yarn add @nuxt/static
```

Using npm:

```
npm i @nuxt/static
```

## Development

- Clone repostory
- Use `yarn install` to install dependencies
- Use `yarn static` to run command on test fixture

## License

[MIT License](./LICENSE)
