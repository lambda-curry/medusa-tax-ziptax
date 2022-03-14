import { ClaimService, OrderService } from '@medusajs/medusa/dist/services';
import {
  ITaxService,
  ItemTaxCalculationLine,
  ShippingTaxCalculationLine,
  TaxCalculationContext,
} from '@medusajs/medusa';
import { Address } from '@medusajs/medusa';
import { BaseService } from 'medusa-interfaces';
import { Logger } from 'winston';
import { ProviderTaxLine } from '@medusajs/medusa/dist/types/tax-service';
import { CachedZipTaxRateRepository } from '../repositories/cached-zip-tax-rate';
import { ZipTaxClient, ZipTaxRate } from '../utils/ziptax';

export interface ZipTaxPluginOptions {
  api_key: string;
}

export default class ZipTaxService extends BaseService implements ITaxService {
  static identifier = 'ziptax';

  constructor(
    { logger, claimService, orderService, cachedZipTaxRateRepository },
    { api_key }: ZipTaxPluginOptions
  ) {
    super();
    this.logger = logger;
    this.orderService = orderService;
    this.claimService = claimService;
    this.cachedZipTaxRateRepository = cachedZipTaxRateRepository;
    this.client = new ZipTaxClient({
      apiKey: api_key,
    });
  }

  logger: Logger;
  orderService: OrderService;
  claimService: ClaimService;
  cachedZipTaxRateRepository: CachedZipTaxRateRepository;
  private client: ZipTaxClient;

  getIdentifier() {
    return 'ziptax';
  }

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
    this.logger.info(`ZipTax Address String: ${address}`);

    const zipTaxRate = await this.fetchTaxRate(address);
    this.logger.info(`ZipTax Address String: ${JSON.stringify(zipTaxRate)}`);

    if (!zipTaxRate) return [];

    const taxRate = zipTaxRate.taxUse;

    return [
      ...itemLines.map(line => ({
        rate: taxRate,
        name: 'Sales Tax',
        code: null,
        item_id: line.item.id,
      })),
      ...shippingLines.map(line => ({
        rate: taxRate,
        name: 'Sales Tax',
        code: null,
        shipping_method_id: line.shipping_method.id,
      })),
    ];
  }

  private buildAddressString(address: Address) {
    return `${address.address_1} ${address.address_2}, ${address.city} ${address.province}, ${address.postal_code}`;
  }

  private async fetchTaxRate(address: string): Promise<ZipTaxRate> {
    const cachedZipTaxRates = await this.cachedZipTaxRateRepository.find({
      where: { address },
      order: { updated_at: 'DESC' },
    });

    const cachedZipTaxRate = cachedZipTaxRates[0];

    if (cachedZipTaxRate) return cachedZipTaxRate.tax_data as ZipTaxRate;

    const rates = await this.client.getTaxRates(address);

    const rate = rates[0];

    if (!rate) return rate;

    await this.cachedZipTaxRateRepository.insert({
      tax_data: rate as any,
      address,
    });

    return rate;
  }
}
