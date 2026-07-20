function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function asWalkableObject(value: unknown): Record<string, unknown> | null {
  if (isAbsent(value)) return {}
  if (isPlainObject(value)) return value
  return null
}

/**
 * Returns dotted paths whose values differ between `before` and `after`.
 * Arrays and non-plain objects are compared as leaf values (not walked).
 * `null` / `undefined` are treated as empty objects when the other side is an object.
 */
export function diffSettingsPaths(
  before: unknown,
  after: unknown,
  prefix = ''
): string[] {
  if (valuesEqual(before, after)) return []

  const beforeObject = asWalkableObject(before)
  const afterObject = asWalkableObject(after)

  if (beforeObject === null || afterObject === null) {
    return [prefix]
  }

  const keys = new Set([
    ...Object.keys(beforeObject),
    ...Object.keys(afterObject)
  ])
  const paths: string[] = []

  for (const key of [...keys].sort()) {
    const path = prefix ? `${prefix}.${key}` : key
    const beforeHas = Object.prototype.hasOwnProperty.call(beforeObject, key)
    const afterHas = Object.prototype.hasOwnProperty.call(afterObject, key)
    const beforeValue = beforeObject[key]
    const afterValue = afterObject[key]

    if (!beforeHas) {
      paths.push(...diffSettingsPaths(undefined, afterValue, path))
      continue
    }

    if (!afterHas) {
      paths.push(...diffSettingsPaths(beforeValue, undefined, path))
      continue
    }

    const beforeWalkable = asWalkableObject(beforeValue)
    const afterWalkable = asWalkableObject(afterValue)

    if (beforeWalkable !== null && afterWalkable !== null) {
      paths.push(...diffSettingsPaths(beforeValue, afterValue, path))
      continue
    }

    if (!valuesEqual(beforeValue, afterValue)) {
      paths.push(path)
    }
  }

  return paths
}

export function getValueAtPath(value: unknown, path: string): unknown {
  if (!path) return value

  const parts = path.split('.')
  let current: unknown = value

  for (const part of parts) {
    if (!isPlainObject(current) || !(part in current)) {
      return undefined
    }
    current = current[part]
  }

  return current
}
