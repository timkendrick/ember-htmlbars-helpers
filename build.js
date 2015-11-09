/* eslint-env node */

var fs = require('fs');
var path = require('path');
var objectAssign = require('object-assign');
var glob = require('glob');
var mkdirp = require('mkdirp');
var del = require('del');
var babel = require('babel-core');

var config = loadJson('./.babelrc');

var outputPath = path.resolve(__dirname, './dist');
var mainSourcePath = path.resolve(__dirname, 'index.js');
var packagesSourcePath = path.resolve(__dirname, './packages');
var mainOutputPath = path.join(outputPath, 'index.js');

var packageNames = getPackageNames(packagesSourcePath);

removeDirectory(outputPath);
buildPackages(packagesSourcePath, outputPath, packageNames, config);
buildMain(mainSourcePath, mainOutputPath, packageNames, config);


function buildPackages(sourcePath, outputPath, localPackageNames, config) {
  var packagePaths = getChildDirectories(sourcePath);
  packagePaths.forEach(function(packagePath) {
    var packageName = getPackageName(packagePath);
    var packageOutputPath = path.join(outputPath, packageName);
    buildPackage(packagePath, packageOutputPath, localPackageNames, config);
  });
}

function buildMain(sourcePath, outputPath, localPackageNames, config) {
  var transpilerOptions = objectAssign({}, config, {
    resolveModuleSource: function(source, filename) {
      if (isLocalPackageImport(source, localPackageNames)) {
        return './' + source;
      }
      return source;
    }
  });
  transpileFile(sourcePath, outputPath, transpilerOptions);
}

function buildPackage(sourcePath, outputPath, localPackageNames, config) {
  var packageSourcePath = path.join(sourcePath, './lib');
  var packageOutputPath = outputPath;
  var sourcePaths = glob.sync(packageSourcePath + '/**/*.js');
  var transpilerOptions = objectAssign({}, config, {
    resolveModuleSource: function(source, filename) {
      if (isLocalPackageImport(source, localPackageNames)) {
        var relativePath = path.relative(filename, packageSourcePath);
        return relativePath + '/' + source;
      }
      return source;
    }
  });
  sourcePaths.forEach(function(sourcePath) {
    var outputPath = sourcePath.replace(packageSourcePath, packageOutputPath);
    transpileFile(sourcePath, outputPath, transpilerOptions);
  });
}

function getPackageNames(sourcePath) {
  return getChildDirectories(packagesSourcePath).map(function(packagePath) {
    return getPackageName(packagePath);
  });
}

function getPackageName(packagePath) {
  return path.basename(packagePath);
}

function transpileFile(inputPath, outputPath, options) {
  var output = babel.transformFileSync(inputPath, options).code;
  ensureDirectoryExists(path.dirname(outputPath));
  fs.writeFileSync(outputPath, output);
  return output;
}

function isLocalPackageImport(importPath, packageNames) {
  var rootPackage = importPath.split('/')[0];
  return packageNames.indexOf(rootPackage) !== -1;
}

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
}

function removeDirectory(path) {
  del.sync(path);
}

function ensureDirectoryExists(path) {
  mkdirp.sync(path);
}

function getChildDirectories(directoryPath) {
  return fs.readdirSync(directoryPath)
  .map(function(filename) {
    return path.join(directoryPath, filename);
  }).filter(function(filePath) {
    return fs.statSync(filePath).isDirectory();
  });
}
