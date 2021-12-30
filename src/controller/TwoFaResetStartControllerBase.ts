import { DefaultController } from '@ts-core/backend/controller';
import { ILogger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { ITwoFaResetStartDto, ITwoFaResetStartDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaService } from '../TwoFaService';

export class TwoFaResetStartControllerBase extends DefaultController<ITwoFaResetStartDto, ITwoFaResetStartDtoResponse> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, protected service: TwoFaService) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async execute(params: ITwoFaResetStartDto): Promise<ITwoFaResetStartDtoResponse> {
        return this.service.resetStart(params.ownerUid, params.type);
    }
}
