export type Tier = {
  qty: number;
  price: number;
  percent: number;
  expiry: string
};

export type ProductDiscount = {
  itemCode: string;
  itemName: string;
  groupCode: number;
  groupName: string;
  inStock: number;
  committed: number;
  ordered: number;
  price: number;
  hasDiscount: boolean;
  barCode: string | null;
  salesUnit: string | null;
  salesItemsPerUnit: number;
  imageUrl: string | null;
  taxType: "EXE" | "INA";
  tiers: Tier[];
  quantity: number;
  unitPrice: number;
  originalPrice: number;
};

export type CreateOrder = {
  cardCode: string,
  docDate: string,
  docDueDate: string,
  comments: string,
  lines: [
    {
      itemCode: string,
      quantity: number,
      lineTotal: number,
      priceList: number,
      priceAfterVAT: number,
      taxCode: string,
    }
  ]
}

export interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: string;
}

export interface CustomersResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OrderLineType {
  itemCode: string;
  itemDescription: string;
  barCode: string;
  quantity: number;
  priceAfterVAT: number;
  taxCode: string;
  lineTotal: number;
}

export interface OrderDataType {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  address: string;
  docDate: string;
  vatSum: number;
  docTotal: number;
  comments: string;
  salesPersonCode: number;
  lines: OrderLineType[];
}

export interface PaymentData {
  docEntry: number;
  docNum: number;
  cardCode: string;
  cardName: string;
  docDate: string; // ISO date string
  total: number;
  paymentMeans: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Cheque';
  cash: number;
  transfer: number;
  check: number;
  credit: number;
  payment: {
    transferDate: string | null;
    transferReference: string | null;
    transferAccountName: string;
    dueDate: string | null;
    checkNumber: string | null;
    bankCode: string | null;
    checkSum: number | null;
    cardVoucherNum: string | null;
    cardCreditSum: number;
  }[];
  invoices: {
    invoiceDocEntry: number;
    invoiceDocNum: number;
    appliedAmount: number;
    invoiceDate: string; // ISO date string
    numAtCard: string;
    docTotal: number;
    saldoAnterior: number;
    pendiente: number;
  }[];
}