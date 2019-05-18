const path = require('path');
const fs = require('fs-extra');
const uglify = require('uglify-es');
const _ = require('lodash');
const package = require('./package.json');

// Copy config.json to dist
fs.copySync(path.join(__dirname, 'src', 'config.json'), path.join(__dirname, 'dist', 'config.json'));

// Copy all assets
if ( package && package.assets && typeof package.assets === 'object' && package.assets.constructor === Array ) {

  for ( const asset of package.assets ) {

    fs.copySync(path.join(__dirname, 'src', asset), path.join(__dirname, 'dist', asset));

  }

}

// Uglify all files
function scanDirRec(dir) {

  const all = fs.readdirSync(path.join(__dirname, dir));
  let files = [];
  const dirs = [];

  for ( const item of all ) {

    const stat = fs.statSync(path.join(__dirname, dir, item));

    if ( ! stat ) continue;

    if ( stat.isDirectory() ) dirs.push(item);
    if ( stat.isFile() ) files.push(path.join(dir, item));

  }

  for ( const item of dirs ) {

    files = _.concat(files, scanDirRec(path.join(dir, item)));

  }

  return files;

}

const files = scanDirRec('dist').filter(file => {

  return path.extname(file).toLowerCase() === '.js';

});

files.map(file => {

  const content = fs.readFileSync(file, { encoding: 'utf8' });

  const result = uglify.minify(content, { mangle: { toplevel: true } });

  if ( result.error ) {

    console.log(result.error);
    process.exit();

  }

  fs.writeFileSync(path.join(__dirname, file), result.code);

});
