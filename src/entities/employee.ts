import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {EmpDesignation} from "../types";
import Invoice from "./invoice";
import Salary from "./salary";

@Entity()
export default class Employee extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    empName: string

    @Column()
    empPhone: string

    @Column({enum: EmpDesignation, type: 'enum'})
    designation: EmpDesignation

    @Column({nullable: true})
    empEmail: string

    @Column({nullable: true})

    empAddress: string

    @Column({nullable: true, default: 0})
    empSalary: number

    @OneToMany(() => Invoice, iv => iv.employee, {cascade: true, eager: true})
    sales: Invoice[]

    @Column({nullable: true})
    joiningDate: Date

    @OneToMany(() => Salary, sl => sl.employee, {cascade: true, eager: true})
    salary: Salary[]
    @Column()
    showroom: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}