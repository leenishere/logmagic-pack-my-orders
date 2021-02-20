import { ContainerSpec, OrderRequest, ShipmentRecord } from "./interfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {}

  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */
    const dummyObject: ShipmentRecord = {
      orderId: "",
      totalVolume: {
        unit: "",
        value: 0,
      },
      containers: [],
    };

    return dummyObject;
  }
}
