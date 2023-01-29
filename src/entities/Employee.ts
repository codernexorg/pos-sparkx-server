import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
export default class Employee extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    empName: string

    @Column()
    empPhone: string

    @Column({nullable: true})
    empEmail: string

    @Column({nullable: true})

    empAddress: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}