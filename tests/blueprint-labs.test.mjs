import test from 'node:test';
import assert from 'node:assert/strict';
import { majorityProbability as vote, inferenceEstimate as infer, mcpExchange } from '../assets/blueprint-lab-models.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
test('binary majority agrees with enumeration and symmetry', () => {
  close(vote(.6, 3), .648);
  for (const n of [1, 3, 5, 9, 15, 21, 31]) {
    close(vote(0, n), 0); close(vote(1, n), 1); close(vote(.5, n), .5);
    close(vote(.65, n) + vote(.35, n), 1);
  }
});
test('shared outcomes eliminate sampling gains; below 50% extra votes hurt', () => {
  close(vote(.65, 31, 1), .65);
  close(vote(.65, 1, .4), .65);
  close(vote(.65, 5, .4), .4 * .65 + .6 * vote(.65, 5));
  assert.ok(vote(.65, 31) > vote(.65, 5, .4));
  assert.ok(vote(.3, 31) < vote(.3, 5));
  for (const args of [[.5, 2], [1.1, 5], [.5, 5, -1], [.5, 33]]) assert.throws(() => vote(...args), RangeError);
});
test('long context raises GQA KV traffic and lowers decode throughput', () => {
  const short = infer(2048), long = infer(131072);
  assert.equal(infer(8192).kvBytes, 2 ** 30);
  assert.equal(long.kvBytes / short.kvBytes, 64);
  assert.ok(long.tokensPerSecond < short.tokensPerSecond);
  assert.ok(short.tokensPerSecond < short.weightOnlyTPS);
  close(long.prefillSeconds / short.prefillSeconds, 64);
  close(long.decodeSeconds * long.tokensPerSecond, 1);
  assert.throws(() => infer(0), RangeError);
});
test('MCP sample separates host schema and 2026-07-28 wire format', () => {
  const schema = { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] };
  const tools = [{ name: 'search', description: 'Search records', input_schema: schema }];
  const call = { name: 'search', arguments: { query: 'example' } };
  const messages = mcpExchange(tools, call, 'found').map(([, body]) => body);
  for (const request of messages.filter(m => m.method)) {
    assert.equal(request.params._meta['io.modelcontextprotocol/protocolVersion'], '2026-07-28');
  }
  assert.deepEqual(messages[2].result.tools[0].inputSchema, schema);
  assert.equal(messages[2].result.tools[0].input_schema, undefined);
  assert.deepEqual(messages[3].params.arguments, call.arguments);
  assert.equal(messages[4].id, messages[3].id);
  assert.equal(messages[4].result.resultType, 'complete');
  assert.deepEqual(tools[0].input_schema, schema);
});
