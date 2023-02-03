import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import Product from "./product";
import {Showroom} from "./index";


@Entity()
export default class Invoice extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        default: "000001", nullable: true
    })
    invoiceNo: string

    @Column({nullable: true, default: "Paid", enum: ["Paid", "Due"]})
    invoiceStatus: string

    @Column({nullable: true, default: "Spark X Fashion Wear Limited"})
    businessName: string

    @Column({nullable: true, default: "Dhaka, Dhaka, Bangladesh"})
    businessAddress: string

    @Column({nullable: true})
    customerName: string

    @Column({nullable: true})
    customerMobile: string

    @ManyToMany(() => Product, product => product)
    @JoinTable()
    products: Product[]

    @Column({nullable: true})
    showroomName: string

    @Column({nullable: true})
    showroomAddress: string

    @Column({nullable: true})
    showroomInvoiceCode: string

    @Column({nullable: true})
    showroomMobile: string

    @ManyToOne(() => Showroom, sr => sr.id, {onDelete: 'CASCADE'})
    showroomId: number

    @Column()
    invoiceAmount: number

    @Column({nullable: true})
    paidAmount: number

    @Column({nullable: true})
    dueAmount: number

    @Column({nullable: true})
    changeAmount: number

    @Column({nullable: true, default: 0})
    discountAmount: number

    @Column({nullable: true})
    quantity: number


    @CreateDateColumn()
    createdAt: Date


    @UpdateDateColumn()
    updatedAt: Date

    @DeleteDateColumn()
    deletedAt: Date

}