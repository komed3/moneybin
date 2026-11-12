export type Optional< T, N extends boolean > =
  | ( undefined extends T ? undefined : never )
  | ( N extends true ? null extends T ? null : never : never );
