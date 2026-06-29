
declare const __lsBrand: unique symbol

export type Brand<K, T> = K & {[__lsBrand]: T}

export function asBrandedId<ID, T>(id: ID): Brand<ID, T> {
	return id as Brand<ID, T>
}