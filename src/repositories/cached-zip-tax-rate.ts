import { CachedZipTaxRate } from 'models/cached-zip-tax-rate';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(CachedZipTaxRate)
export class CachedZipTaxRateRepository extends Repository<CachedZipTaxRate> {}
