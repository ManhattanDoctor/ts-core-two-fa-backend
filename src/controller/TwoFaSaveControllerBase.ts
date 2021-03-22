import { DefaultController } from '@ts-core/backend/controller';
import { ILogger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { ITwoFaSaveDto, ITwoFaSaveDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaService } from '../TwoFaService';

export class TwoFaSaveControllerBase extends DefaultController<ITwoFaSaveDto, ITwoFaSaveDtoResponse> {
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

    public async execute(params: ITwoFaSaveDto): Promise<ITwoFaSaveDtoResponse> {
        await this.service.save(params.ownerUid, params.type, params.token);
    }
}
