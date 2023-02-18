import {BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Employee} from "./index";

@Entity()
export default class Salary extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    salaryAmount: number

    @ManyToOne(() => Employee, emp => emp.salary, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    employee: Employee

    @CreateDateColumn()
    createdAt: Date
}