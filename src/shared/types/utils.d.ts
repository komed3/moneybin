export type Optional< T, N extends boolean > =
  | ( T extends undefined ? undefined : never )
  | ( N extends true ? T extends null ? null : never : never );
