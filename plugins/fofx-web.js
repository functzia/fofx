const Koa = require('koa');
const koaBody = require('koa-body');

const app = (module.exports = new Koa());

app.use(koaBody());

const endpoints = {};
app.use(async function webApp(ctx) {
  const { request } = ctx;
  const rule = /\/api\/(.+)/;
  const match = rule.exec(request.url);
  if (!match) {
    return ctx.throw(404, 'Bad URL');
  }
  const [, ep] = match;
  if (!endpoints[ep]) {
    return ctx.throw(404, 'Endpoint not found');
  }
  const { response, sendToQueue } = endpoints[ep];
  if (response) {
    ctx.body = await sendToQueue(request);
  } else {
    ctx.body = { ok: true };
  }
});

app.listen(9999);

module.exports = {
  type: 'web',
  input({ endpoint, response }, sendToQueue) {
    endpoints[endpoint] = { response, sendToQueue };
  }
};
