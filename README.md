<p align="center">
  <br><strong>tasco</strong><br>Build tool for the HTML/CSS/JavaScript.
</p>

<p align="center">
  <a href="https://npmjs.com/package/tasco"><img src="https://img.shields.io/npm/v/tasco.svg?style=flat-square" alt="NPM version"></a>
  <a href="https://npmjs.com/package/tasco"><img src="https://img.shields.io/npm/dm/tasco.svg?style=flat-square" alt="NPM downloads"></a>
  <a href="https://circleci.com/gh/egoist/tasco"><img src="https://img.shields.io/circleci/project/egoist/tasco/master.svg?style=flat-square" alt="Build Status"></a>
</p>

## tl;dr

|task|support|
|---|---|
|js|rollup, babel or buble, es2015, stage-1|
|css|postcss with precss and autoprefixer, you can also enable `sugarss`|
|html|pug (formerly jade)|

## Install

```bash
$ npm install -g tasco
```

## Usage

First thing first, everything tasco cares started from a `tasco.json`:

```json
{
  "js": {
    "entry": "./src/index.js",
    "dest": "./dist"
  }
}
```

That's it, run `tasco js` to start task:

<img src="http://ooo.0o0.ooo/2016/08/21/57b978488c3f9.png" width="400" />

Currently only three types of task you can run: `js` `css` `html`, you can run `tasco build` to run them all in once:

<img src="http://ooo.0o0.ooo/2016/08/21/57b97c3969920.png" width="400" />

**Bonus:** Use `--watch` to enter watch mode. unlike `gulp`, tasco will not exit on error in watch mode.

## API

### Common Properties

#### entry

Type: `string`<br>
Required: `true`

File entry, only supported single file.

#### dest

Type: `string`<br>
Required: `true`

The dest directory.

#### watch

Type: `string` `array` `glob patterns`<br>
Required: `false`<br>
Default: `path.dirname(entry)`

If you run tasco with `--watch` tasco will watch the files/dirs you specific in this property. By default it's the dirname of entry file.

#### rename

Type: `string`<br>
Required: `false`

The new name of output file.

#### compress

Type: `boolean`<br>
Default: `false`

Whether to compress the output file.

#### map

Type: `boolean` `string`<br>
Default: `false`

Whether to generate source maps. Set `map` to `inline` to generate inline source map.

### JavaScript Only

#### moduleName

Type: `string`<br>
Required: `false`

If `moduleName` is provided the bundle will be generated in UMD format and give it the `moduleName`, otherwise `CommonJS` format is used.

#### buble

Type: `boolean`<br>
Required: `false`

Use buble to compile ESnext code, we use babel by default.

### CSS Only

#### sugarss

Type: `boolean`<br>
Default: `false`

Use `sugarss` as PostCSS parser.

### HTML Only

HTML is usimg pug (formerly) to render.

#### data

Type: `object`<br>
Required: `false`<br>
Default: `{time: Date.now(), pkg)}`

The local variables to render in your pug (formerly jade) template, `pkg` is `tasco` package.json

## License

MIT © [EGOIST](https://github.com/egoist)
