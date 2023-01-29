import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import User from './user';

@Entity()
export default class WareHouse extends BaseEntity {
    @PrimaryGeneratedColumn()
    whId: number;

    @Column()
    whCode: string;

    @Column()
    whName: string;

    @Column({nullable: true})
    whMobile: string

    @Column({nullable: true})
    whLocation: string;

    @ManyToOne(() => User, user => user.id, {nullable: true})
    creator: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
