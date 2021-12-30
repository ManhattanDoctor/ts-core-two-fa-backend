import { DefaultController } from '@ts-core/backend/controller';
import { ILogger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { ITwoFaResetFinishDto, ITwoFaResetFinishDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaService } from '../TwoFaService';

export class TwoFaResetFinishControllerBase extends DefaultController<ITwoFaResetFinishDto, ITwoFaResetFinishDtoResponse> {
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

    public async execute(params: ITwoFaResetFinishDto): Promise<ITwoFaResetFinishDtoResponse> {
        return this.service.resetFinish(params.resetUid);
    }
}
