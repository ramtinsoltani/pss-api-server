import {
  ModuleType,
  ModuleDecoratorArgs,
  RouterDecoratorArgs,
  ValidationType,
  ValidationRule,
  ValidatorFunction,
  HeaderValidator,
  BodyValidator,
  FlatBodyValidator
} from './models';

import _ from 'lodash';

export * from './models';

export function Service(config: ModuleDecoratorArgs) {

  return (target: any) => {

    target.prototype.__metadata = {
      name: config.name,
      type: ModuleType.Service
    };

  };

}

export function Router(config: RouterDecoratorArgs) {

  return (target: any) => {

    target.prototype.__metadata = {
      name: config.name,
      type: ModuleType.Router,
      routes: config.routes,
      priority: config.priority || 0
    };

  };

}

export namespace type {

  /**
  * String type comparison.
  */
  export function string(value: any): boolean { return typeof value === 'string' }
  /**
  * Number type comparison.
  */
  export function number(value: any): boolean { return typeof value === 'number'; }
  /**
  * Boolean type comparison.
  */
  export function boolean(value: any): boolean { return typeof value === 'boolean'; }
  /**
  * Null type comparison.
  */
  export function nil(value: any): boolean { return value === null; }
  /**
  * Array type comparison.
  * @param validator      A validator to apply to all items inside the array.
  * @param arrayValidator A validator to apply to the whole array (e.g. len.min).
  */
  export function array(validator?: ValidatorFunction, arrayValidator?: ValidatorFunction): ValidatorFunction {

    return (value: any): boolean => {

      if ( ! value || typeof value !== 'object' || value.constructor !== Array ) return false;

      let validation: boolean = true;

      if ( validator ) {

        for ( const item of value ) {

          validation = validation && validator(item);

        }

      }

      if ( arrayValidator ) {

        validation = validation && arrayValidator(value);

      }

      return validation;

    };

  }

  /**
  * Enum type comparison.
  * @param enumerator An enumerator to validate the value against.
  */
  export function ofenum(enumerator: any): ValidatorFunction {

    return (value: any): boolean => {

      return _.values(enumerator).includes(value);

    };

  }

}

/**
* Validates an object against the given flat body validator (useful for validating arrays of objects).
* @param bodyValidator A flat body validator.
*/
export function sub(bodyValidator: FlatBodyValidator): ValidatorFunction {

  return (value: any): boolean => {

    if ( ! value || typeof value !== 'object' || value.constructor !== Object ) return false;

    for ( const key of _.keys(bodyValidator) ) {

      if ( ! value.hasOwnProperty(key) || ! bodyValidator[key](value[key]) ) return false;

    }

    return true;

  };

}

/**
* Equality comparison.
*/
export function equal(val: any): ValidatorFunction {

  return (value: any): boolean => {

    return value === val;

  };

}

/**
* ORs all given validators.
* @param validators A rest argument of validators.
*/
export function or(...validators: Array<ValidatorFunction>): ValidatorFunction {

  return (value: any): boolean => {

    let orCheck: boolean = false;

    for ( const validator of validators ) {

      orCheck = orCheck || validator(value);

    }

    return orCheck;

  };

}

/**
* ANDs all given validators.
* @param validators A rest argument of validators.
*/
export function and(...validators: Array<ValidatorFunction>): ValidatorFunction {

  return (value: any): boolean => {

    let andCheck: boolean = true;

    for ( const validator of validators ) {

      andCheck = andCheck && validator(value);

    }

    return andCheck;

  };

}

/**
* Negates all given validators.
* @param validators A rest argument of validators.
*/
export function not(validator: ValidatorFunction): ValidatorFunction {

  return (value: any): boolean => {

    return ! validator(value);

  };

}

/**
* Makes the given validator optional (e.g. property may not exist but if it does...).
* @param validator A validator.
*/
export function opt(validator: ValidatorFunction): ValidatorFunction {

  return (value: any): boolean => {

    return value === undefined ? true : validator(value);

  };

}

/**
* Validates a string against a given regular expression (no string type check!).
* @param validators A rest argument of validators.
*/
export function match(regex: RegExp) {

  return (value: any): boolean => {

    return !! value.match(regex);

  };

}

export namespace num {

  /**
  * The property must be greater than or equal to the given number.
  */
  export function min(val: number): ValidatorFunction {

    return (value: any): boolean => {

      return value >= val;

    };

  }

  /**
  * The property must be less than or equal to the given number.
  */
  export function max(val: number): ValidatorFunction {

    return (value: any): boolean => {

      return value <= val;

    };

  }

  /**
  * The property must be within the given range (inclusive).
  */
  export function range(min: number, max: number): ValidatorFunction {

    return (value: any): boolean => {

      return value >= min && value <= max;

    };

  }

}

export namespace len {

  /**
  * The length of the property must be greater than or equal to the given number.
  */
  export function min(val: number): ValidatorFunction {

    return (value: any): boolean => {

      return value.length >= val;

    };

  }

  /**
  * The length of the property must be less than or equal to the given number.
  */
  export function max(val: number): ValidatorFunction {

    return (value: any): boolean => {

      return value.length <= val;

    };

  }

  /**
  * The length of the property must be within the given range.
  */
  export function range(min: number, max: number): ValidatorFunction {

    return (value: any): boolean => {

      return value.length >= min && value.length <= max;

    };

  }

}

export function header(validator: HeaderValidator): ValidationRule { return { type: ValidationType.Header, validator: validator }; }
export function query(validator: string[]): ValidationRule { return { type: ValidationType.Query, validator: validator }; }
export function body(validator: BodyValidator): ValidationRule { return { type: ValidationType.Body, validator: validator }; }
export function custom(validator: ValidatorFunction): ValidationRule { return { type: ValidationType.Custom, validator: validator } };

export class ServerError {

  public code: string;
  public error: boolean;
  public message: string;

  constructor(msg: string, code?: string) {

    this.message = msg;
    this.code = code || 'UNKNOWN_ERROR';
    this.error = true;

  }

}
