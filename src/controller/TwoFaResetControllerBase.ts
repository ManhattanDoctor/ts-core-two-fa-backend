import { DefaultController } from '@ts-core/backend/controller';
import { Logger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { ITwoFaResetDto, ITwoFaResetDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaService } from '../TwoFaService';

export class TwoFaResetControllerBase extends DefaultController<ITwoFaResetDto, ITwoFaResetDtoResponse> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, private service: TwoFaService) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async execute(params: ITwoFaResetDto): Promise<ITwoFaResetDtoResponse> {
        await this.service.reset(params.ownerUid, params.type);
    }
}
