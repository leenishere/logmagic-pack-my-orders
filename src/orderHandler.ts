import { throws } from "assert";
import { ContainerSpec, OrderRequest, ShipmentRecord } from "./interfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {

  }

  /*
  Variables: 
  this.parameters (Object) - containerspecs
  orderRequest (Object) - orders
  */ 

  getVolume (height:number, breadth:number, width:number) {
    return height*breadth*width;
  }

  getContainerVolumes(){
    let containerVolumes:any = [];
    this.parameters.containerSpecs.forEach(element => {
      
      var x:number = element.dimensions.length;
      var y:number = element.dimensions.height;
      var z:number = element.dimensions.width;

      const volume:number = this.getVolume(x,y,z)
      var container:string = element.containerType;
      containerVolumes.push({containerType: element.containerType, containerVol: volume});
    });

    return containerVolumes;
  }

  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */

    // Get totalVolume
    const orderProducts = orderRequest.products;
    var returnObj: ShipmentRecord;
    
    orderProducts.forEach(element => {
      let calcVolume:number = this.getVolume(element.dimensions.height, element.dimensions.length, element.dimensions.width);
      let unit: string = element.dimensions.unit;

      returnObj.orderId = orderRequest.id;
      returnObj.totalVolume.unit = "cubic" + unit;
      returnObj.totalVolume.value = calcVolume;
    
    });



    // Get Containers
    this.getContainerVolumes();
    



    return returnObj;



    
  }
}
