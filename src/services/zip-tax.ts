import {
  AbstractTaxService,
  ItemTaxCalculationLine,
  ShippingTaxCalculationLine,
  TaxCalculationContext,
} from '@medusajs/medusa';
import { Address } from '@medusajs/medusa';
import { Logger } from 'winston';
import { ProviderTaxLine } from '@medusajs/medusa/dist/types/tax-service';
import { ZipTaxClient, ZipTaxRate } from '../utils/ziptax';
import { EntityManager, Repository } from 'typeorm';
import { CachedZipTaxRate } from '../models/cached-zip-tax-rate';
import { ulid } from 'ulid';

export interface ZipTaxPluginOptions {
  api_key: string;
}

export default class ZipTaxService extends AbstractTaxService {
  static identifier = 'ziptax';

  constructor(options, { api_key }: ZipTaxPluginOptions) {
    super();
    this.logger = options.logger;
    this.manager = options.manager;
    this.client = new ZipTaxClient({
      apiKey: api_key,
    });
  }

  private logger: Logger;
  private manager: EntityManager;
  private client: ZipTaxClient;

  /**
   * Retrieves the numerical tax lines for a calculation context.
   * @param itemLines - the line item calculation lines
   * @param shippingLines - the shipping calculation lines
   * @param context - other details relevant to the tax determination
   * @return numerical tax rates that should apply to the provided calculation
   *   lines
   */
  async getTaxLines(
    itemLines: ItemTaxCalculationLine[],
    shippingLines: ShippingTaxCalculationLine[],
    { shipping_address }: TaxCalculationContext
  ): Promise<ProviderTaxLine[]> {
    if (!shipping_address) return [];

    const address = this.buildAddressString(shipping_address);

    const zipTaxRate = await this.fetchTaxRate(address);

    if (!zipTaxRate) return [];

    const taxRate = zipTaxRate.taxUse * 100;

    return [
      ...itemLines.map(line => ({
        rate: taxRate,
        name: 'Sales Tax',
        code: 'ziptax_calculated_sales_tax',
        item_id: line.item.id,
      })),
      ...shippingLines.map(line => ({
        rate: taxRate,
        name: 'Sales Tax',
        code: 'ziptax_calculated_sales_tax',
        shipping_method_id: line.shipping_method.id,
      })),
    ];
  }

  private buildAddressString(address: Address) {
    return Object.entries(address).reduce(
      (prev, [key, value], index, array) => {
        const isLast = index === array.length - 1;

        if (isLast) return `${prev}${value}`;

        const text = value ?? '';
        const addSpace = !!array[index + 1][1] ? ' ' : '';
        const addComma = ['city', 'country_code'].includes(array[index + 1][0])
          ? ','
          : '';

        return `${prev}${text}${addComma}${addSpace}`;
      },
      ``
    );
  }

  private async fetchTaxRate(address: string): Promise<ZipTaxRate> {
    this.logger.debug(`Fetching Tax Rate for ${address}`);

    const repository: Repository<CachedZipTaxRate> =
      this.manager.getRepository(CachedZipTaxRate);

    const cachedZipTaxRates = await repository.find({
      where: { address },
      order: { updated_at: 'DESC' },
    });

    const cachedZipTaxRate = cachedZipTaxRates[0];

    if (cachedZipTaxRate) return cachedZipTaxRate.tax_data as ZipTaxRate;

    const rates = await this.client.getTaxRates(address);

    const rate = rates[0];

    if (!rate) return rate;

    await repository.insert({
      id: 'ztax_' + ulid(),
      tax_data: rate as any,
      address,
    });

    return rate;
  }
}
