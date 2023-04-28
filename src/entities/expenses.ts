import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import Showroom from "./showroom";

@Entity()
export default class Expenses extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    expenseName: string

    @Column({nullable: true})
    employeeId: number

    @Column({nullable: true})
    expenseReason: string


    @ManyToOne(() => Showroom, sr => sr.expenses, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    showroom: Showroom

    @Column()
    expenseCost: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}