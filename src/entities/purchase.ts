import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {PurchaseStatus} from "../types";
import Product from "./product";

@Entity()
export default class Purchase extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    purchaseName: string

    @Column({nullable: true})
    supplierName: string

    @Column({type: 'float'})
    purchaseAmount: number

    @Column({type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.Received})
    purchaseStatus: PurchaseStatus

    @OneToMany(() => Product, p => p.purchase, {cascade: true, eager: true})
    products: Product[]

    @Column({type: 'float'})
    dueAmount: number

    @Column({type: 'float'})
    paidAmount: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}