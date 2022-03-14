import axios, { Axios } from 'axios';

export interface ZipTaxClientProps {
  apiKey: string;
}

export interface ZipTaxRate {
  geoPostalCode: string;
  geoCity: string;
  geoCounty: string;
  geoState: string;
  taxSales: number;
  taxUse: number;
  txbService: string;
  txbFreight: string;
  stateSalesTax: number;
  stateUseTax: number;
  citySalesTax: number;
  cityUseTax: number;
  cityTaxCode: string;
  countySalesTax: number;
  countyUseTax: number;
  countyTaxCode: string;
  districtSalesTax: number;
  districtUseTax: number;
  district1Code: string;
  district1SalesTax: number;
  district1UseTax: number;
  district2Code: string;
  district2SalesTax: number;
  district2UseTax: number;
  district3Code: string;
  district3SalesTax: number;
  district3UseTax: number;
  district4Code: string;
  district4SalesTax: number;
  district4UseTax: number;
  district5Code: string;
  district5SalesTax: number;
  district5UseTax: number;
  originDestination: string;
}

interface ZipTaxResponse {
  version: string;
  rCode: number;
  results: ZipTaxRate[];
}

export class ZipTaxClient {
  constructor(props: ZipTaxClientProps) {
    this.apiKey = props.apiKey;
    this.client = axios.create({
      baseURL: 'https://api.zip-tax.com/request',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private apiKey = '';
  private client: Axios;

  async getTaxRates(address: string): Promise<ZipTaxRate[]> {
    const res = await this.client.get<ZipTaxResponse>('/v40', {
      params: { address, key: this.apiKey },
    });
    return res.data.results;
  }
}
