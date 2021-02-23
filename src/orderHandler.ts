import { throws } from "assert";
import { ContainerSpec, OrderRequest, ShipmentRecord } from "./interfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {}
  /*
  Variables: 
  this.parameters (Object) - containerspecs
  orderRequest (Object) - orders
  */ 
  getVolume(height:number, breadth:number, width:number): number {
    return height*breadth*width;
  }

  getContainerVolumes(){
    let containerVolumes:Array<{containerType:string, dimensions:{length:number, height:number, width:number, containerVol:number}}> = [];
    this.parameters.containerSpecs.forEach(element => {
      
      var x:number = element.dimensions.length;
      var y:number = element.dimensions.height;
      var z:number = element.dimensions.width;

      const volume:number = this.getVolume(x,y,z)
      var container:string = element.containerType;
      containerVolumes.push({containerType: element.containerType, dimensions:{length:x, height: y, width: z, containerVol: volume}});
    });
    return containerVolumes;
  }

  // getShipmentRecord(orderId:string, unit:string, totalVol:number):ShipmentRecord{
  //   var record: ShipmentRecord = {
  //     orderId: orderId,
  //     totalVolume: { // volume of ALL containers
  //       unit: "cubic " + unit,
  //       value: totalVol,
  //     },
  //     containers: [] // record of each container used. quantity - number of product packed inside.
  //   };
    
  //   return record;
  // }

  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */
    /*
    1. Check if volume of 1 product is bigger than container  
      2. If bigger, remove from list of usable containers.
      3. If smaller, check xyz of product.
        4. If bigger, remover from list of usable containers.
        5. If smaller, modulo to find number of product that can fit into each container. 
    6. return totalVolume of container, record of each container used.
    */

    const orderProducts = orderRequest.products;
    // var record:ShipmentRecord = {};
    var record: ShipmentRecord = {
      orderId: "",
      totalVolume: { // volume of ALL containers
        unit: "",
        value: 0,
      },
      containers: [] // record of each container used. quantity - number of product packed inside.
    };

    orderProducts.forEach(element => {
      const x:number = element.dimensions.length;
      const y:number = element.dimensions.height;
      const z:number = element.dimensions.width;

      let unit:string = element.dimensions.unit;
      // 1. Check if volume of 1 product is bigger than container
      let pdtVolume:number = this.getVolume(x,y,z);
      var containerVol = this.getContainerVolumes();
      
      // 2. If bigger, remove from list of usable containers
      for (var i:number = 0; i < containerVol.length; i++){
        const dimensions = containerVol[i].dimensions;
        if (pdtVolume > dimensions.containerVol){
          containerVol = containerVol.slice(i,1);
        }
      }
   
      console.log("REMAINING CONTAINER: " + JSON.stringify(containerVol));
      // 3. If smaller, check xyz of product.
      for (var i:number = 0; i < containerVol.length; i++){
        const dimensions = containerVol[i].dimensions;   
      }
      
      let totalVol:number =  pdtVolume * element.orderedQuantity;
      
      // Push Record.
    
      record.orderId = orderRequest.id;
      record.totalVolume.unit = "cubic " + unit;
    
    });

    //console.log(JSON.stringify(record));
    return record;

  }
}
