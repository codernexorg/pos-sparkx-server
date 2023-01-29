import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export default class Supplier extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    supplierName: string;

    @Column({nullable: true})
    supplierEmail: string;

    @Column()
    contactPersonName: string;

    @Column({nullable: true})
    contactPersonNumber: string;

    @Column({nullable: true})
    altContactNumber: string;

    @Column({nullable: true})
    supplierAddress: string;

    @Column({nullable: true})
    extraInfo: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
