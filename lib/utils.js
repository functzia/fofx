const fs = require('fs');
const rimraf = require('rimraf');

const promisify = fn => (...args) =>
  new Promise((resolve, reject) =>
    fn(
      ...args,
      (err, ...values) =>
        err ? reject(err) : resolve(values.length > 1 ? values : values[0])
    )
  );

async function getJsonFromFile(filePath) {
  const content = await promisify(fs.readFile)(filePath, { encoding: 'utf8' });
  return JSON.parse(content);
}

module.exports = {
  promisify,
  getJsonFromFile,
  rimraf: promisify(rimraf),
};
