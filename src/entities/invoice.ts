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
import {Employee, Showroom} from "./index";
import {InvoiceStatus} from "../types";


@Entity()
export default class Invoice extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        default: "000001", nullable: true
    })
    invoiceNo: string

    @Column({nullable: true, default: InvoiceStatus.Paid, enum: InvoiceStatus, type: 'enum'})
    invoiceStatus: InvoiceStatus

    @Column({nullable: true, default: "Spark X Fashion Wear Limited"})
    businessName: string

    @Column({nullable: true, default: "Dhaka, Dhaka, Bangladesh"})
    businessAddress: string

    @Column({nullable: true})
    customerName: string

    @Column({nullable: true})
    customerMobile: string

    @ManyToMany(() => Product, product => product, {cascade: true, eager: true})
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

    @ManyToOne(() => Showroom, sr => sr.invoices, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    showroomId: number

    @ManyToOne(() => Employee, emp => emp.sales, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    employee: Employee

    @Column({type: 'float', nullable: true})
    invoiceAmount: number

    @Column({nullable: true, type: 'float'})
    paidAmount: number

    @Column({nullable: true, type: 'float'})
    dueAmount: number

    @Column({nullable: true, type: 'float'})
    changeAmount: number

    @Column({nullable: true, default: 0, type: 'float'})
    discountAmount: number

    @Column({nullable: true, default: 0, type: 'float'})
    vat: number
    @Column({nullable: true})
    quantity: number


    @CreateDateColumn()
    createdAt: Date


    @UpdateDateColumn()
    updatedAt: Date

    @DeleteDateColumn()
    deletedAt: Date

}