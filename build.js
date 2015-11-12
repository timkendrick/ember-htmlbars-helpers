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
var importAliases = {
};

removeDirectory(outputPath);
buildPackages(packagesSourcePath, outputPath, packageNames, importAliases, config);
buildMain(mainSourcePath, mainOutputPath, packageNames, importAliases, config);


function buildPackages(sourcePath, outputPath, localPackageNames, importAliases, config) {
  var packagePaths = getChildDirectories(sourcePath);
  packagePaths.forEach(function(packagePath) {
    var packageName = getPackageName(packagePath);
    var packageOutputPath = path.join(outputPath, packageName);
    buildPackage(packagePath, packageOutputPath, localPackageNames, importAliases, config);
  });
}

function buildMain(sourcePath, outputPath, localPackageNames, importAliases, config) {
  var transpilerOptions = objectAssign({}, config, {
    resolveModuleSource: createModuleResolver(sourcePath, importAliases, localPackageNames)
  });
  transpileFile(sourcePath, outputPath, transpilerOptions);
}

function buildPackage(sourcePath, outputPath, localPackageNames, importAliases, config) {
  var packageSourcePath = path.join(sourcePath, './lib');
  var packageOutputPath = outputPath;
  var sourcePaths = glob.sync(packageSourcePath + '/**/*.js');
  var transpilerOptions = objectAssign({}, config, {
    resolveModuleSource: createModuleResolver(packageSourcePath, importAliases, localPackageNames)
  });
  sourcePaths.forEach(function(sourcePath) {
    var outputPath = sourcePath.replace(packageSourcePath, packageOutputPath);
    transpileFile(sourcePath, outputPath, transpilerOptions);
  });
}

function createModuleResolver(packageRoot, aliases, localPackageNames) {
    return function(source, filename) {
      source = resolveAliases(source, aliases);
      if (isLocalPackageImport(source, localPackageNames)) {
        var relativePath = path.relative(filename, packageRoot) || '.';
        return relativePath + '/' + source;
      } else {
        return source;
      }
    }


    function resolveAliases(importPath, aliases) {
      var resolvedPath = Object.keys(aliases).reduce(function(importPath, key) {
        var source = key;
        var destination = aliases[key];
        var pattern = new RegExp('^' + source + '(?=$|\\/)');
        return importPath.replace(pattern, destination);
      }, importPath);
      return resolvedPath;
    }
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
