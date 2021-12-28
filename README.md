# Tasco

A simple tool for running npm scripts, with monorepo support.

## Features

- Faster than running `npm run`
- Supports monorepo: building dependent packages automatically
- Simplicity, no configuration

If you want more robust solutions, please check out [Turbo](https://turborepo.org/) or [NX](https://nx.dev/).

## Installation

```bash
npm i tasco -g
```

## Usage

```bash
tasco run [script_name]

# For complete usage:
tasco help run
```

### Monorepo Support

Tasco by default runs the scripts in current directory, if you're working in a monorepo, you can pass `--filter` flag to select the packages you want to run. The filter flag supports glob patterns, and can be multiple. For example: `tasco run --filter "**" build` will run `build` script in all packages (excluding the root).

Let's say you have a pnpm/yarn/npm workspace:

```
- packages/foo
- packages/bar
```

Where `bar` depends on `foo`, if you run `tasco run --filter bar build`, it will build `foo` first for you.

**Note that `--filter` and other Tasco flags should be passed before the npm script name, everything after the script name will be forwared to the npm script.**

## List Scripts

Run `tasco run` without a script name to list available scripts in current directory, you can also use `--filter` flag to list scripts in selected packages.

## Roadmap

- [ ] Run npm scripts in parallel when possible.
- [ ] Maybe some sort of caching system, which should require no configurations.

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
