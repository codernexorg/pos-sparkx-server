import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
export default class Tax extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({default: 1.5, type: 'float'})
    tax: number

    @Column({default: 'Vat'})
    taxName: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}