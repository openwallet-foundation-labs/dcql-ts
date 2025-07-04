import { DcqlError } from '../dcql-error'

/**
 * Deep merge two objects. Null values will be overriden if there is a value in one
 * of the two objects. Objects can also be arrays, but otherwise only primitive types
 * are allowed
 */
export function deepMerge(source: Array<unknown> | object, target: Array<unknown> | object): Array<unknown> | object {
  let newTarget = target

  if (Object.getPrototypeOf(source) !== Object.prototype && !Array.isArray(source)) {
    throw new DcqlError({
      message: 'source value provided to deepMerge is neither an array or object.',
      code: 'PARSE_ERROR',
    })
  }
  if (Object.getPrototypeOf(target) !== Object.prototype && !Array.isArray(target)) {
    throw new DcqlError({
      message: 'target value provided to deepMerge is neither an array or object.',
      code: 'PARSE_ERROR',
    })
  }

  for (const [key, val] of Object.entries(source)) {
    if (
      val !== null &&
      typeof val === 'object' &&
      (Object.getPrototypeOf(val) === Object.prototype || Array.isArray(val))
    ) {
      const newValue = deepMerge(
        val,
        newTarget[key as keyof typeof newTarget] ?? new (Object.getPrototypeOf(val).constructor)()
      )
      newTarget = setValue(newTarget, key, newValue)
    } else if (val != null) {
      newTarget = setValue(newTarget, key, val)
    }
  }
  return newTarget
}

// biome-ignore lint/suspicious/noExplicitAny: value can be anything
function setValue(target: any, key: string, value: any) {
  let newTarget = target

  if (Array.isArray(newTarget)) {
    newTarget = [...newTarget]
    newTarget[key as keyof typeof newTarget] = value
  } else if (Object.getPrototypeOf(newTarget) === Object.prototype) {
    newTarget = { ...newTarget, [key]: value }
  } else {
    throw new DcqlError({
      message: 'Unsupported type for deep merge. Only primitive types or Array and Object are supported',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  return newTarget
}
