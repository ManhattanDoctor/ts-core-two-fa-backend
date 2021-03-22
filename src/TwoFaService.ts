import { ILogger, LoggerWrapper } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { MapCollection } from '@ts-core/common/map';
import { ITwoFaProvider } from './provider/ITwoFaProvider';
import { TwoFaDatabaseService } from './TwoFaDatabaseService';
import { ExtendedError } from '@ts-core/common/error';
import { TwoFaEntity } from './database';
import { TwoFaOwnerUid } from '@ts-core/two-fa';

export class TwoFaService extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected _providers: MapCollection<ITwoFaProvider>;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, protected database: TwoFaDatabaseService, providers?: Array<ITwoFaProvider>) {
        super(logger);
        this._providers = new MapCollection('type');
        if (_.isEmpty(providers)) {
            this.providers.addItems(providers);
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async create<T = any>(ownerUid: TwoFaOwnerUid, type: string): Promise<T> {
        let twoFa = await this.database.get(ownerUid, type);

        if (_.isNil(twoFa)) {
            let provider = this.getProvider(type);
            let details = await provider.create(ownerUid);

            twoFa = TwoFaEntity.create(ownerUid, type, details);
            await this.database.save(twoFa);
        } else if (twoFa.isEnabled) {
            throw new ExtendedError(`Unable to create 2FA for "${ownerUid}": it's already enabled, need to reset first`, ExtendedError.HTTP_CODE_FORBIDDEN);
        }
        return twoFa.details;
    }

    public async save(ownerUid: TwoFaOwnerUid, type: string, token: string): Promise<TwoFaEntity> {
        let twoFa = await this.database.get(ownerUid, type);
        if (_.isNil(twoFa)) {
            throw new ExtendedError(`Unable to verify 2FA: 2FA is nil`, ExtendedError.HTTP_CODE_FORBIDDEN);
        }
        if (twoFa.isEnabled) {
            throw new ExtendedError(`Unable to save 2FA: it's already enabled, need to reset first`, ExtendedError.HTTP_CODE_FORBIDDEN);
        }

        let provider = this.getProvider(twoFa.type);
        await provider.validate(token, twoFa);

        twoFa.isTemporary = false;
        return this.database.save(twoFa);
    }

    public async validate(ownerUid: TwoFaOwnerUid, type: string, token: string): Promise<void> {
        let twoFa = await this.database.get(ownerUid, type);
        if (_.isNil(twoFa)) {
            throw new ExtendedError(`Unable to verify 2FA: 2FA is nil`, ExtendedError.HTTP_CODE_FORBIDDEN);
        }

        let provider = this.getProvider(twoFa.type);
        await provider.validate(token, twoFa.details);
    }

    public async reset(ownerUid: TwoFaOwnerUid, type: string): Promise<TwoFaEntity> {
        let twoFa = await this.database.get(ownerUid, type);
        if (_.isNil(twoFa)) {
            throw new ExtendedError(`Unable to reset 2FA: 2FA is nil`);
        }
        twoFa.details = null;
        twoFa.isTemporary = true;
        return this.database.save(twoFa);
    }

    public getProvider(type: string): ITwoFaProvider {
        if (!this.providers.has(type)) {
            throw new ExtendedError(`Unable to get "${type}" provider`);
        }
        return this.providers.get(type);
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

        this._providers.clear();
        this._providers = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get providers(): MapCollection<ITwoFaProvider> {
        return this._providers;
    }
}
