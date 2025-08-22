import type {
  BaseMacro,
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
