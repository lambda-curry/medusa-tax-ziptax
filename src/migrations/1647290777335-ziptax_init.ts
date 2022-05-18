import { MigrationInterface, QueryRunner } from 'typeorm';

export class ZiptaxInit1647290777335 implements MigrationInterface {
  name = 'ziptaxInit1647290777335';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cached_ziptax_rate" ("id" character varying NOT NULL, "address" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tax_data" jsonb, CONSTRAINT "PK_33b71b53f650d0b39e99ccef4ff" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cached_ziptax_rate"`);
  }
}
