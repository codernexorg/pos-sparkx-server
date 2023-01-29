import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import Customer from "./customer";

@Entity()
export default class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    itemCode: string;

    @Column()
    productGroup: string;

    @Column({nullable: true})
    productCode: string;

    @Column({nullable: true})
    invoiceNumber: string;

    @Column({nullable: true})
    invoiceDate: Date;

    @Column()
    lotNumber: string;

    @Column({nullable: true})
    invoiceTotalPrice: number;

    @Column({nullable: true})
    supplierName: string;

    @Column({nullable: true})
    totalItem: number;

    @Column({nullable: true})
    transportationCost: number;
    @Column({type: 'float'})
    unitCost: number;

    @Column({nullable: true, type: 'float'})
    unitTotalCost: number;

    @Column({nullable: true})
    whName: string;

    @Column()
    showroomName: string;

    @Column({nullable: true})
    grossProfit: string;

    @Column({nullable: true})
    grossMargin: string;

    @Column({default: 'Unsold', enum: ['Unsold', 'Sold', 'Lost', 'Damaged', 'Returned']})
    sellingStatus: string;

    @Column({default: 0})
    returnStatus: number;

    @Column({nullable: true})
    deliveryDate: Date;

    @Column({nullable: true})
    challanNumber: string;

    @Column({nullable: true})
    size: string;

    @Column({nullable: true})
    purchaseName: string;

    @Column({nullable: true})
    brand: string;

    @Column({type: 'float'})
    sellPrice: number;

    @ManyToOne(() => Customer, c => c.products, {nullable: true})
    customer: Customer

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
