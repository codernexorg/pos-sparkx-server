import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Product} from "./index";

@Entity()
export default class Customer extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    customerName: string

    @Column()
    customerPhone: string

    @Column({nullable: true})
    customerEmail: string

    @Column({nullable: true})

    customerAddress: string

    @Column({nullable: true, default: 0})
    credit: number

    @Column({nullable: true, default: 0})
    due: number

    @Column({nullable: true, default: 0})
    paid: number;

    @OneToMany(() => Product, p => p.customer)
    products: Product[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}