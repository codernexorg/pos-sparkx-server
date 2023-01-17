import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import Product from "./product";


@Entity()
export default class Invoice extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        default: "#0001", nullable: true
    })
    invoiceNo: string

    @Column({nullable: true, default: "Paid"})
    invoiceStatus: string

    @Column({nullable: true, default: "Spark X Fashion Wear Limited"})
    businessName: string

    @ManyToMany(() => Product, product => product)
    @JoinTable()
    products: Product[]

    @Column()
    invoiceAmount: number


    @CreateDateColumn()
    createdAt: Date


    @UpdateDateColumn()
    updatedAt: Date

}