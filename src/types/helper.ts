export type RequireOnlyFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type AbstractType<T = any> = abstract new (...args: any[]) => T;
