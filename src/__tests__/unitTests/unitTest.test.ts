
import { ContainerSpec, OrderRequest, ShipmentRecord } from "../../interfaces";
import { OrderHandler } from "../../orderHandler";

describe("UNIT TESTING FOR GET CLASS METHODS", () => {
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
      ];

      const orderHandler = new OrderHandler({ containerSpecs });
    test("Test getVolume",() =>{
        expect(orderHandler.getVolume(10,10,10)).toEqual(1000);
        expect(() => orderHandler.getVolume(-10,-10,10)).toThrowError();
    })

    test("Test getMax", () =>{
        expect(orderHandler.getMax([1,1000,200])).toEqual(1000);
        expect(() => orderHandler.getMax([])).toThrowError();
    })


    test("Test compareLarger", () =>{
      expect(orderHandler.compareLarger(10,1000)).toEqual(true);
      expect(()=> orderHandler.compareLarger(-10,10)).toThrowError();
   })



});