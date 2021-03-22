import { DefaultController } from '@ts-core/backend/controller';
import { Logger } from '@ts-core/common/logger';
import * as _ from 'lodash';
import { ITwoFaCreateDto, ITwoFaCreateDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaService } from '../TwoFaService';

export class TwoFaCreateControllerBase extends DefaultController<ITwoFaCreateDto, ITwoFaCreateDtoResponse> {
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

    public async execute(params: ITwoFaCreateDto): Promise<ITwoFaCreateDtoResponse> {
        let details = await this.service.create(params.ownerUid, params.type);
        return { type: params.type, details };
    }
}
