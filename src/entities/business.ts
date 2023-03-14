import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export default class Business extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    address: string

    @Column()
    name: string

    @Column()
    phone: string

    @Column({default: 'bdt'})
    currencyCode: string

    @Column({nullable: true})
    twilioSid: string;

    @Column({nullable: true})
    twilioAuthToken: string

    @Column({nullable: true})
    twilioNumber: string

    @Column({type: 'float', default: 0})
    defaultTax: number

}