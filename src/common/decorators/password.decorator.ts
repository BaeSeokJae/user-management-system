import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class PasswordValidatorConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    // 최소 8자 이상, 특수문자 1개, 대문자 1개, 숫자 1개 필수
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
  }

  defaultMessage(args: ValidationArguments) {
    return '비밀번호는 최소 8자 이상이며, 특수문자 1개, 대문자 1개, 숫자 1개를 포함해야 합니다.';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordValidatorConstraint
    });
  };
}
