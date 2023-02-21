import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import Expenses from "./expenses";
import Supplier from "./supplier";
import Customer from "./customer";
import Invoice from "./invoice";
import User from "./user";


@Entity()
export default class Showroom extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    showroomName: string;

    @Column()
    showroomCode: string;

    @Column({nullable: true})
    showroomMobile: string

    @Column()
    showroomAddress: string;

    @OneToMany(() => Expenses, ex => ex.showroom, {cascade: true, eager: true})
    expenses: Expenses[];

    @OneToMany(() => Supplier, sr => sr.showroom, {cascade: true, eager: true})
    supplier: Supplier[]

    @OneToMany(() => Customer, cm => cm.showroom, {cascade: true, eager: true})
    customer: Customer[]


    @OneToMany(() => Invoice, invoice => invoice.showroomId, {
        eager: true,
        cascade: true
    })
    invoices: Invoice[]

    @OneToMany(() => User, user => user.showroom, {eager: true, cascade: true})
    users: User[]
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
