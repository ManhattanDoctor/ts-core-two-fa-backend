import { Column, Index, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsDefined, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import * as _ from 'lodash';
import { TransformUtil } from '@ts-core/common/util';
import { ITwoFa, TwoFaOwnerUid } from '@ts-core/two-fa';

@Entity({ name: 'two_fa' })
@Index(['type', 'ownerUid'], { unique: true })
export class TwoFaEntity implements ITwoFa {
    // --------------------------------------------------------------------------
    //
    //  Static Methods
    //
    // --------------------------------------------------------------------------

    public static create<T>(ownerUid: TwoFaOwnerUid, type: string, details: T): TwoFaEntity {
        let item = new TwoFaEntity();
        item.ownerUid = ownerUid;
        item.type = type;
        item.isTemporary = true;
        item.details = details;
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    @PrimaryGeneratedColumn()
    @IsOptional()
    @IsNumber()
    public id: number;

    @Column()
    @IsString()
    public type: string;

    @Column({ name: 'owner_uid', type: 'integer' })
    @IsNumber()
    public ownerUid: TwoFaOwnerUid;

    @Column({ nullable: true, type: 'json' })
    @IsOptional()
    @IsDefined()
    public details: any;

    @Column({ name: 'is_temporary' })
    @IsBoolean()
    public isTemporary: boolean;

    @CreateDateColumn({ name: 'created_date' })
    @Type(() => Date)
    public createdDate: Date;

    @UpdateDateColumn({ name: 'updated_date' })
    @Type(() => Date)
    public updatedDate: Date;

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public toObject(): ITwoFa {
        return TransformUtil.fromClass(this, { excludePrefixes: ['__'] });
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public get isEnabled(): boolean {
        return !this.isTemporary && !_.isNil(this.details);
    }
}
