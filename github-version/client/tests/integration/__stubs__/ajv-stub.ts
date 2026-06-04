// Stub for ajv/dist/core — used to prevent CJS require() failures
// in the Workers runtime when @modelcontextprotocol/sdk pulls in ajv.
// Integration tests do not exercise MCP schema validation paths.
export default {};
export class Ajv {
	compile() { return () => true; }
	validate() { return true; }
	addSchema() { return this; }
	addFormat() { return this; }
	addKeyword() { return this; }
}
