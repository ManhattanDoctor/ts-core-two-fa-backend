import { DefaultController } from '@ts-core/backend/controller';
import { ExtendedError } from '@ts-core/common/error';
import { Logger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { TwoFaDatabaseService } from '../TwoFaDatabaseService';

export class TwoFaRemoveControllerBase extends DefaultController<number, void> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, private database: TwoFaDatabaseService) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async execute(id: number): Promise<void> {
        let item = await this.database.twoFa.findOne({ id });
        if (_.isNil(item)) {
            throw new ExtendedError(`Can't find 2FA`, ExtendedError.HTTP_CODE_NOT_FOUND);
        }
        await this.database.remove(item.id);
    }
}
