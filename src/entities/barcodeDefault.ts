import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export default class BarcodeDefault extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number
    @Column({nullable: true, default: 1})
    barcodeId: number
}