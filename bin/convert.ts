import { decode } from "https://deno.land/x/msgpack@v1.2/mod.ts";

/**
 * The type mapping between `nvim --api-info` and TypeScript type.
 */
const NVIM_TYPE_MAP = {
  Integer: 'number',
  Float: 'number',
  String: 'string',
  Boolean: 'boolean',
  Array: 'Array<unknown>',
  Dictionary: 'Record<string, unknown>',
  Object: 'Record<string, unknown>',
  Buffer: 'Buffer',
  Window: 'Window',
  Tabpage: 'Tabpage',
  void: 'void',
  LuaRef: 'unknown',
  'ArrayOf(String)': 'string[]',
  'ArrayOf(Integer)': 'number[]',
  'ArrayOf(Integer, 2)': '[number, number]',
  'ArrayOf(Dictionary)': 'Record<string, unknown>[]',
  'ArrayOf(Window)': 'Window[]',
  'ArrayOf(Buffer)': 'Buffer[]',
  'ArrayOf(Tabpage)': 'Tabpage[]',
} as const;
type NVIM_TYPE_MAP = typeof NVIM_TYPE_MAP;

/**
 * Decoded `nvim --api-info`.
 */
const apiInfo = decode(await Deno.readAll(Deno.stdin)) as {
  version: {
    major: number;
    minor: number;
    patch: number;
    api_level: number;
    api_compatible: number;
    api_prerelease: boolean;
  };
  functions: {
    name: string;
    parameters: [type: keyof NVIM_TYPE_MAP, name: string][];
    method: boolean;
    deprecated_since?: number;
    since: number;
    return_type: keyof NVIM_TYPE_MAP;
  }[];
};

const types = `type Buffer = number;
type Window = number;
type Tabpage = number;
`;

const functions = apiInfo.functions
  .filter((v) => {
    // Ignore deprecated apis
    return v.deprecated_since == null;
  })
  .map((v) => {
    // Check if the type name can be converted to TypeScript types.
    if (!NVIM_TYPE_MAP[v.return_type]) {
      throw new Error(`Unknown type name detected '${v.return_type}'.`);
    }
    v.parameters.forEach(v => {
      if (!NVIM_TYPE_MAP[v[0]]) {
        throw new Error(`Unknown type name detected '${v[0]}'.`);
      }
    });

    // Generate TypeScript definition.
    return `  ${v.name}: (${v.parameters.map(([type, name]) => {
      return `${name}: ${NVIM_TYPE_MAP[type]}`;
    }).join(', ')}) => ${NVIM_TYPE_MAP[v.return_type]};`;
  })
  .join("\n\n");

await Deno.writeAll(Deno.stdout, new TextEncoder().encode(`${types}
export declare interface Nvim {
${functions}
}
`));

