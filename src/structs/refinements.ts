/* eslint-disable no-shadow */
import { ErrorDetail, GenericErrorDetail, ValueErrorDetail } from '../error'
import { Struct, Refiner, SimpleRefiner } from '../struct'
import { toFailures } from '../utils'

interface SizeErrorDetail<T extends number | Date> extends ErrorDetail {
  class: 'size'
  actually: T
  min: T | undefined
  max: T | undefined
  minExlusive: boolean
  maxExlusive: boolean
}

/**
 * Ensure that a string, array, map, or set is empty.
 */

export function empty<
  T extends string | any[] | Map<any, any> | Set<any>,
  S extends any,
  E extends ErrorDetail
>(struct: Struct<T, S, E>): Struct<T, S, E | SizeErrorDetail<number>> {
  const expected = `Expected an empty ${struct.type}`

  return refine<T, S, E, SizeErrorDetail<number>>(struct, 'empty', (value) => {
    if (value instanceof Map || value instanceof Set) {
      const { size } = value
      return (
        size === 0 ||
        ([
          {
            class: 'size',
            actually: size,
            min: 0,
            max: 0,
            minExlusive: false,
            maxExlusive: false,
            message: `${expected} but received one with a size of \`${size}\``,
          },
        ] as SizeErrorDetail<number>[])
      )
    } else {
      const { length } = value as string | any[]
      return (
        length === 0 ||
        ([
          {
            class: 'size',
            actually: length,
            min: 0,
            max: 0,
            minExlusive: false,
            maxExlusive: false,
            message: `${expected} but received one with a length of \`${length}\``,
          },
        ] as SizeErrorDetail<number>[])
      )
    }
  })
}

/**
 * Ensure that a number or date is below a threshold.
 */

export function max<
  T extends number | Date,
  S extends any,
  E extends ErrorDetail
>(
  struct: Struct<T, S, E>,
  threshold: T,
  options: {
    exclusive?: boolean
  } = {}
): Struct<T, S, E | SizeErrorDetail<T>> {
  const { exclusive } = options
  return refine(struct, 'max', (value) => {
    return (
      (exclusive ? value < threshold : value <= threshold) ||
      ([
        {
          class: 'size',
          actually: value,
          min: undefined,
          max: threshold,
          minExlusive: false,
          maxExlusive: exclusive,
          message: `Expected a ${struct.type} greater than ${
            exclusive ? '' : 'or equal to '
          }${threshold} but received \`${value}\``,
        },
      ] as SizeErrorDetail<T>[])
    )
  })
}

/**
 * Ensure that a number or date is above a threshold.
 */

export function min<
  T extends number | Date,
  S extends any,
  E extends ErrorDetail
>(
  struct: Struct<T, S, E>,
  threshold: T,
  options: {
    exclusive?: boolean
  } = {}
): Struct<T, S, E | SizeErrorDetail<T>> {
  const { exclusive } = options
  return refine(struct, 'min', (value) => {
    return (
      (exclusive ? value > threshold : value >= threshold) ||
      ([
        {
          class: 'size',
          actually: value,
          min: threshold,
          max: undefined,
          minExlusive: exclusive,
          maxExlusive: false,
          message: `Expected a ${struct.type} greater than ${
            exclusive ? '' : 'or equal to '
          }${threshold} but received \`${value}\``,
        },
      ] as SizeErrorDetail<T>[])
    )
  })
}
/**
 * Ensure that a string matches a regular expression.
 */

export function pattern<T extends string, S extends any, E extends ErrorDetail>(
  struct: Struct<T, S, E>,
  regexp: RegExp
): Struct<T, S, E | ValueErrorDetail<T>> {
  return refine(struct, 'pattern', (value) => {
    return (
      regexp.test(value) ||
      ([
        {
          class: 'value',
          except: regexp.source,
          actually: value,
          message: `Expected a ${struct.type} matching \`/${regexp.source}/\` but received "${value}"`,
        },
      ] as ValueErrorDetail<T>[])
    )
  })
}

/**
 * Ensure that a string, array, number, date, map, or set has a size (or length, or time) between `min` and `max`.
 */

export function size<
  T extends string | number | Date | any[] | Map<any, any> | Set<any>,
  S extends any,
  E extends ErrorDetail
>(
  struct: Struct<T, S, E>,
  min: number,
  max: number = min
): Struct<T, S, E | SizeErrorDetail<number | Date>> {
  // todo fix return type
  const expected = `Expected a ${struct.type}`
  const of = min === max ? `of \`${min}\`` : `between \`${min}\` and \`${max}\``

  return refine(struct, 'size', (value) => {
    if (typeof value === 'number' || value instanceof Date) {
      return (
        (min <= value && value <= max) ||
        ([
          {
            class: 'size',
            actually: value,
            min,
            max,
            minExlusive: false,
            maxExlusive: false,
            message: `${expected} ${of} but received \`${value}\``,
          },
        ] as SizeErrorDetail<number | Date>[])
      )
    } else if (value instanceof Map || value instanceof Set) {
      const { size } = value
      return (
        (min <= size && size <= max) ||
        ([
          {
            class: 'size',
            actually: value,
            min,
            max,
            minExlusive: false,
            maxExlusive: false,
            message: `${expected} with a size ${of} but received one with a size of \`${size}\``,
          },
        ] as SizeErrorDetail<number | Date>[])
      )
    } else {
      const { length } = value as string | any[]
      return (
        (min <= length && length <= max) ||
        ([
          {
            class: 'size',
            actually: value,
            min,
            max,
            minExlusive: false,
            maxExlusive: false,
            message: `${expected} with a length ${of} but received one with a length of \`${length}\``,
          },
        ] as SizeErrorDetail<number | Date>[])
      )
    }
  })
}

/**
 * Augment a `Struct` to add an additional refinement to the validation.
 *
 * The refiner function is guaranteed to receive a value of the struct's type,
 * because the struct's existing validation will already have passed. This
 * allows you to layer additional validation on top of existing structs.
 */

export function refine<T, S, E1 extends ErrorDetail, E2 extends ErrorDetail>(
  struct: Struct<T, S, E1>,
  name: string,
  refiner: Refiner<T, E2>
): Struct<T, S, E1 | E2>
export function refine<T, S, E1 extends ErrorDetail>(
  struct: Struct<T, S, E1>,
  name: string,
  refiner: SimpleRefiner<T>
): Struct<T, S, E1 | GenericErrorDetail>
export function refine<T, S>(
  struct: Struct<T, S, any>,
  name: string,
  refiner: Refiner<T, any> | SimpleRefiner<T>
): Struct<T, S, any> {
  return new Struct<T, S, any>({
    ...struct,
    *refiner(value, ctx) {
      yield* struct.refiner(value, ctx)
      let result = refiner(value, ctx)
      if (result === false || typeof result === 'string') {
        result = [
          {
            class: 'generic',
            message: result || 'error',
          },
        ] as GenericErrorDetail[]
      } else if (result === true || result === undefined) {
        return
      }
      const failures = toFailures<T, S, any>(result, ctx, struct, value)

      for (const failure of failures) {
        yield { ...failure, refinement: name }
      }
    },
  })
}
