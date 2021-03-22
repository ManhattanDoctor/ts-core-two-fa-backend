import { DefaultController } from '@ts-core/backend/controller';
import { Logger } from '@ts-core/common/logger';
import { TypeormUtil } from '@ts-core/backend/database/typeorm';
import { TwoFaDatabaseService } from '../TwoFaDatabaseService';
import { ITwoFaListDto, ITwoFaListDtoResponse } from '@ts-core/two-fa/dto';
import { TwoFaEntity } from '../database';
import { ITwoFa } from '@ts-core/two-fa';

export class TwoFaListControllerBase extends DefaultController<ITwoFaListDto, ITwoFaListDtoResponse> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, protected database: TwoFaDatabaseService) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    public async execute(params: ITwoFaListDto): Promise<ITwoFaListDtoResponse> {
        let query = this.database.twoFa.createQueryBuilder();
        return TypeormUtil.toPagination(query, params, this.transform);
    }

    protected transform = async (item: TwoFaEntity): Promise<ITwoFa> => item.toObject();
}
