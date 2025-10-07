import axios from 'axios';

export interface OrderDetailsResponse {
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
  lines: {
    itemCode: string;
    itemDescription: string;
    barCode: string;
    quantity: number;
    priceAfterVAT: number;
  }[];
}

export const fetchOrderDetails = async (
  docEntry: number,
  fetchUrl: string,
  token: string
): Promise<OrderDetailsResponse> => {
  try {
    const response = await axios.get<OrderDetailsResponse>(
      `/api/Quotations/${docEntry}`,
      {
        baseURL: fetchUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // console.log(response.cached ? 'Detalles del pedido cargados desde CACHE' : 'Detalles del pedido cargados desde RED');
    return response.data;
  } catch (error) {
    console.error('Error fetching order details for edit:', error);
    throw error;
  }
};