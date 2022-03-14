import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DbAwareColumn,
  resolveDbType,
} from '@medusajs/medusa/dist/utils/db-aware-column';
import { ulid } from 'ulid';

@Entity({ name: 'cached_ziptax_rate' })
export class CachedZipTaxRate {
  @PrimaryColumn()
  id: string;

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  tax_data: any;

  @Column({ nullable: false, type: 'varchar' })
  address: string;

  @CreateDateColumn({ type: resolveDbType('timestamptz') })
  created_at: Date;

  @UpdateDateColumn({ type: resolveDbType('timestamptz') })
  updated_at: Date;

  @BeforeInsert()
  private beforeInsert() {
    if (this.id) return;
    const id = ulid();
    this.id = `ztax_${id}`;
  }
}
