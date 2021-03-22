import { TwoFaEntity } from './database';
import { Connection, DeleteResult, Repository } from 'typeorm';
import { ILogger, LoggerWrapper } from '@ts-core/common/logger';
import { TypeormUtil } from '@ts-core/backend/database/typeorm';
import * as _ from 'lodash';
import { TwoFaOwnerUid } from '@ts-core/two-fa';

export class TwoFaDatabaseService extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, protected connection: Connection) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async get(ownerUid: TwoFaOwnerUid, type: string): Promise<TwoFaEntity> {
        return this.twoFa.findOne({ ownerUid, type });
    }

    public async has(ownerUid: TwoFaOwnerUid, isEnabled: boolean = true): Promise<boolean> {
        let items = await this.twoFa.find({ ownerUid });
        return isEnabled ? items.some(item => item.isEnabled) : items.length > 0;
    }

    public async save(item: TwoFaEntity): Promise<TwoFaEntity> {
        await TypeormUtil.validateEntity(item);
        return this.twoFa.save(item);
    }

    public async remove(id: number): Promise<DeleteResult> {
        return this.twoFa.delete({ id });
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get twoFa(): Repository<TwoFaEntity> {
        return this.connection.getRepository(TwoFaEntity);
    }
}
