import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Product, Showroom} from "./index";

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

    @ManyToMany(() => Product, object => object, {eager: true, cascade: true})
    @JoinTable()
    products: Product[]

    @ManyToOne(() => Showroom, sr => sr.customer, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    showroom: Showroom

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}