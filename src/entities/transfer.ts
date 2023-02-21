import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import Product from "./product";

@Entity()
export default class TransferProduct extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    prevLocation: string

    @Column()
    currentLocation: string

    @Column()
    productCount: number

    @Column()
    transferredLot: string

    @OneToMany(() => Product, p => p.transferredHistory, {cascade: true, eager: true})
    transferredProducts: Product[]


    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}