import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export default class ExpenseType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    expenseName: string
}