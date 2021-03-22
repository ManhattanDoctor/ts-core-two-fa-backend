import { TwoFaOwnerUid } from '@ts-core/two-fa';

export interface ITwoFaProvider<T = any> {
    create(ownerUid: TwoFaOwnerUid): Promise<T>;
    validate(token: string, details: T): Promise<ITwoFaValidateDetails>;

    readonly type: string;
}

export interface ITwoFaValidateDetails {
    isValid: boolean;
}
