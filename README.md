# nvim-types

Generated TypeScript type definition from `nvim --api-info`

# Usage

```ts
import type { Nvim } from '/path/to/this/module/mod.ts';
```

# Generate

```
nvim --api-info | deno run ./bin/convert.ts > ./nvim.ts && deno lint --unstable ./nvim.ts
```

