import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import User from './user';

@Entity()
export default class Showroom extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    showroomName: string;

    @Column()
    showroomCode: string;

    @Column()
    showroomAddress: string;

    @OneToMany(() => User, user => user.assignedShowroom, {nullable: true})
    assignedUsers: User[]


    @ManyToOne(() => User, user => user.showrooms)
    @JoinTable()
    creator: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
