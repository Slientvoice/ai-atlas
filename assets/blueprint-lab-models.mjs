// Teaching models, not measurements of a provider or production deployment.
export function majorityProbability(p, n, rho = 0) {
  if (!Number.isFinite(p) || p < 0 || p > 1 || !Number.isInteger(n) || n < 1 || n > 31 || n % 2 !== 1 || !Number.isFinite(rho) || rho < 0 || rho > 1) {
    throw new RangeError('Use p/rho in [0, 1] and an odd sample count from 1 to 31.');
  }
  let independent = 0;
  for (let k = (n + 1) / 2; k <= n; k++) {
    let combinations = 1;
    for (let i = 0; i < k; i++) combinations *= (n - i) / (i + 1);
    independent += combinations * p ** k * (1 - p) ** (n - k);
  }
  // With probability rho every vote shares one Bernoulli outcome;
  // otherwise votes are independent. Binary outcomes and equal-length samples.
  return rho * p + (1 - rho) * independent;
}

export function inferenceEstimate(tokens) {
  if (!Number.isInteger(tokens) || tokens < 1) throw new RangeError('tokens must be a positive integer');
  const parameters = 8e9, bytes = 2, bandwidth = 3.35e12, flops = 989e12;
  const weightBytes = parameters * bytes;
  const kvBytesPerToken = 2 * 32 * 8 * 128 * bytes;
  const kvBytes = kvBytesPerToken * tokens;
  // Batch=1, full GQA attention, ideal BF16/FP16 H100 SXM throughput.
  // Omits attention FLOPs, intermediate traffic, scheduling and network latency.
  const prefillSeconds = Math.max(2 * parameters * tokens / flops, weightBytes / bandwidth);
  const decodeSeconds = (weightBytes + kvBytes) / bandwidth;
  return { prefillSeconds, decodeSeconds, tokensPerSecond: 1 / decodeSeconds, kvBytes, weightOnlyTPS: bandwidth / weightBytes };
}

export function mcpExchange(tools, call, result) {
  const _meta = {
    'io.modelcontextprotocol/protocolVersion': '2026-07-28',
    'io.modelcontextprotocol/clientInfo': { name: 'atlas-demo', version: '0.34.0' },
    'io.modelcontextprotocol/clientCapabilities': {},
  };
  const request = (id, method, params = {}) => ({ jsonrpc: '2.0', id, method, params: { ...params, _meta } });
  return [
    ['发现服务 · server/discover（可选预查询）', request(1, 'server/discover')],
    ['发现工具 · tools/list 请求', request(2, 'tools/list')],
    ['工具清单 · 由宿主选择并转换给模型', { jsonrpc: '2.0', id: 2, result: { resultType: 'complete', tools: tools.map(({ input_schema, ...tool }) => ({ ...tool, inputSchema: input_schema })) } }],
    ['执行工具 · 宿主将模型意图转换为 tools/call', request(3, 'tools/call', call)],
    ['结果返回 · 宿主再写入模型上下文', { jsonrpc: '2.0', id: 3, result: { resultType: 'complete', content: [{ type: 'text', text: result }] } }],
  ];
}
