module.exports = function(request) {
  console.log(request.body);
  return {
    bar: request.method,
  };
};
