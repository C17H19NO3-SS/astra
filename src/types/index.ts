import type {
  BaseMacro,
  Handler,
  InputSchema,
  LocalHook,
  MergeSchema,
  SingletonBase,
  UnwrapRoute,
} from "elysia";

export type Schema<T extends ""> = LocalHook<
  InputSchema<never>,
  MergeSchema<
    UnwrapRoute<InputSchema<never>, {}, `${T}/${string}`>,
    MergeSchema<{}, MergeSchema<{}, {}, "">, "">,
    ""
  >,
  SingletonBase,
  {},
  BaseMacro,
  never
>;

export interface RouteSchema<T extends ""> {
  handler: Handler;
  schema?: Schema<T>;
}

export interface User {}
