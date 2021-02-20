/* Do not modify this file */

import { ContainerSpec, OrderRequest, ShipmentRecord } from "../../interfaces";
import { OrderHandler } from "../../orderHandler";

describe("Orders Packing Test Cases", () => {
  const containerSpecs: ContainerSpec[] = [
    {
      containerType: "Cardboard A",
      dimensions: {
        unit: "centimeter",
        length: 30,
        width: 30,
        height: 30,
      },
    },
    {
      containerType: "Cardboard B",
      dimensions: {
        unit: "centimeter",
        length: 10,
        width: 20,
        height: 20,
      },
    },
  ];
  const orderHandler = new OrderHandler({ containerSpecs });

  test("Given a small order, pack it into a single container", () => {
    const orderRequest: OrderRequest = {
      id: "ORDER-001",
      products: [
        {
          id: "PRODUCT-001",
          name: "GOOD FORTUNE COOKIES",
          orderedQuantity: 9,
          unitPrice: 13.4,
          dimensions: {
            unit: "centimeter",
            length: 10,
            width: 10,
            height: 30,
          },
        },
      ],
    };
    const expectedShipmentRecord: ShipmentRecord = {
      orderId: "ORDER-001",
      totalVolume: {
        unit: "cubic centimeter",
        value: 27000,
      },
      containers: expect.arrayContaining([
        {
          containerType: "Cardboard A",
          containingProducts: expect.arrayContaining([
            {
              id: "PRODUCT-001",
              quantity: 9,
            },
          ]),
        },
      ]),
    };

    expect(orderHandler.packOrder(orderRequest)).toEqual(
      expectedShipmentRecord
    );
  });

  test("Given a large order, pack it using multiple containers, without exceeding maximum capacity of any containers", () => {
    const orderRequest: OrderRequest = {
      id: "ORDER-002",
      products: [
        {
          id: "PRODUCT-002",
          name: "BAD FORTUNE COOKIES",
          orderedQuantity: 10,
          unitPrice: 13.4,
          dimensions: {
            unit: "centimeter",
            length: 10,
            width: 10,
            height: 30,
          },
        },
      ],
    };
    const expectedShipmentRecord: ShipmentRecord = {
      orderId: "ORDER-002",
      totalVolume: {
        unit: "cubic centimeter",
        value: expect.any(Number),
      },
      containers: expect.arrayContaining([
        {
          containerType: "Cardboard A",
          containingProducts: expect.arrayContaining([
            {
              id: "PRODUCT-002",
              quantity: expect.any(Number),
            },
          ]),
        },
      ]),
    };

    const shipmentRecord = orderHandler.packOrder(orderRequest);
    let totalProductQuantity = 0;
    shipmentRecord.containers.forEach((container) => {
      container.containingProducts.forEach((product) => {
        expect(product.quantity).toBeLessThanOrEqual(9);
        totalProductQuantity += product.quantity;
      });
    });
    expect(totalProductQuantity).toEqual(10);
    expect(shipmentRecord.containers.length).toBeGreaterThan(1);
    expect(shipmentRecord).toEqual(expectedShipmentRecord);
  });

  test("Given an order that cannot fit into any containers, throw an error", () => {
    const orderRequest: OrderRequest = {
      id: "ORDER-003",
      products: [
        {
          id: "PRODUCT-001",
          name: "GOOD FORTUNE COOKIES",
          orderedQuantity: 1,
          unitPrice: 13.4,
          dimensions: {
            unit: "centimeter",
            length: 10,
            width: 10,
            height: 30,
          },
        },
        {
          id: "PRODUCT-003",
          name: "GIANT FORTUNE COOKIES",
          orderedQuantity: 1,
          unitPrice: 99.95,
          dimensions: {
            unit: "centimeter",
            length: 30,
            width: 30,
            height: 50,
          },
        },
      ],
    };

    expect(() => orderHandler.packOrder(orderRequest)).toThrowError();
  });

  test("Given an order that packs into multiple containers, calculate the total volume of all containers used", () => {
    const orderRequest: OrderRequest = {
      id: "ORDER-004",
      products: [
        {
          id: "PRODUCT-004",
          name: "ALMOST-GREAT FORTUNE COOKIES",
          orderedQuantity: 2,
          unitPrice: 13.4,
          dimensions: {
            unit: "centimeter",
            length: 30,
            width: 30,
            height: 25,
          },
        },
      ],
    };
    const expectedShipmentRecord: ShipmentRecord = {
      orderId: "ORDER-004",
      totalVolume: {
        unit: "cubic centimeter",
        value: 54000,
      },
      containers: [
        {
          containerType: "Cardboard A",
          containingProducts: [
            {
              id: "PRODUCT-004",
              quantity: 1,
            },
          ],
        },
        {
          containerType: "Cardboard A",
          containingProducts: [
            {
              id: "PRODUCT-004",
              quantity: 1,
            },
          ],
        },
      ],
    };

    expect(orderHandler.packOrder(orderRequest)).toEqual(
      expectedShipmentRecord
    );
  });
});
