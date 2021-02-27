import { throws } from "assert";
import { timeStamp } from "console";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { ContainerSpec, OrderRequest, ShipmentRecord } from "./interfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {}

   /**
   *  @desc calculate volume
   *  @param height:number, breadth:number, width:number
   *  @returns volume: number
  **/
  getVolume(height:number, breadth:number, width:number): number {
    return height*breadth*width;
  }

  /**
   *  @desc calc specifications with volume of container
   *  @param height:number, breadth:number, width:number
   *  @returns container_info: Array<>
  **/
  getContainerInfo(){
    let container_info:Array<{containerType:string, dimensions:{length:number, height:number, width:number, containerVol:number, arr:number[]}}> = [];
    this.parameters.containerSpecs.forEach(element => {
      
      var x:number = element.dimensions.length;
      var y:number = element.dimensions.height;
      var z:number = element.dimensions.width;

      const volume:number = this.getVolume(x,y,z)
      var container:string = element.containerType;
      container_info.push({containerType: container, dimensions:{length:x, height: y, width: z, containerVol: volume, arr:[x,y,z]}});
    });
    return container_info;
  }

  /**
   *  @desc Check if volume of 1 product is already bigger than containers.
   *  @param pdt_volume:number
   *  @returns container_info: Array<{
   *    containerType: string,
   *    dimensions: {
   *      length: number,
   *      height: number,
   *      width: number,
   *      containerVol: number
   *    }
   *  }>
  **/
  compareSingleVolume(pdt_volume:number){
    const container_info = this.getContainerInfo();  
    
    for (var i:number = container_info.length-1; i >= 0; i--){
      const container_vol = container_info[i].dimensions.containerVol;
      // console.log("Cross check with container: " + container_info[i].containerType);
      if (pdt_volume > container_vol){
        container_info.splice(i,1);  
      }
    }
    return container_info;
  }

  /**
   *  @desc Check if there is any remaining containers available to be used.
   *  @param usable_container: Array<T>;
   *  @returns boolean
  **/
  checkAvailContainer(usable_container:Array<{containerType:string, dimensions:{length:number, height:number, width:number, containerVol:number,arr:number[]}}>){
    if (usable_container.length > 0){
      return true;
    } else{
      return false;
    }
  }

  getMax(arr: number[]) : number{
    let largest_num = Math.max(...arr);
    // console.log(`max number for ${arr} : ` + largest_num);
    return largest_num;   
  }

   /**
   *  @desc Check if product_side is larger than container_side;
   *  @param usable_container: Array<T>;
   *  @returns true - product > container (rej); false - container > product (accept)
  **/
  compareLarger(container_side:number, product_side:number) : boolean{
    console.log("container: " + container_side + " product: " +product_side);
    if (product_side > container_side){
      return true;
    } else {
      return false;
    }
  } 

  compareSides(usable_container:Array<{containerType:string, dimensions:{length:number, height:number, width:number, containerVol:number,arr:number[]}}>, dimension_arr:number[]) : boolean {
    if (dimension_arr.length == 3){
      var temp_array = dimension_arr;
    }  
    
    usable_container.forEach(element => {
      var container_array = element.dimensions.arr;
      console.log(element.containerType);
      if (container_array.length > 0){
        var largest_side_product = this.getMax(dimension_arr);
        console.log("Remaining Value:  " + dimension_arr + " and largest is: " + largest_side_product); 
    
        
        var largest_side_container = this.getMax(container_array);
        if (this.compareLarger(largest_side_container, largest_side_product)){
          //console.log("BIGGER " + element.containerType + dimension_arr)
          throw new Error("Product is larger than container");
        } else {
          //console.log("SMALLER " + element.containerType + dimension_arr)
          dimension_arr.splice(dimension_arr.indexOf(largest_side_product),1);
          container_array = container_array.splice(container_array.indexOf(largest_side_container),1);
          //console.log("dimension array: " + JSON.stringify(dim));
          this.compareSides(usable_container, dimension_arr);
        }

      }  
      else{
        dimension_arr = temp_array;
      }

    });
    
    
    return true;
  }



  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */
    
    const orderProducts = orderRequest.products;
    var record: ShipmentRecord = {
      orderId: "",
      totalVolume: { // volume of ALL containers
        unit: "",
        value: 0,
      },
      containers: [] // record of each container used. quantity - number of product packed inside.
    };

    console.log("ORDER REQUEST: " + orderRequest.id);
    var usable_container;
    orderProducts.forEach(element => {
      const pdt_x:number = element.dimensions.length;
      const pdt_y:number = element.dimensions.height;
      const pdt_z:number = element.dimensions.width;
      const unit:string = element.dimensions.unit;
      const dimension_arr:number[] = [pdt_x, pdt_y, pdt_z];
      //console.log("CURRENT PRODUCT LOOP: " + element.id);

      // // 1. Check if volume of 1 product is bigger than container
      let pdt_volume:number = this.getVolume(pdt_x,pdt_y,pdt_z);  
      usable_container = this.compareSingleVolume(pdt_volume);
      
      if (!this.checkAvailContainer(usable_container)){
        throw new Error("There is no container that can fit the product");
      } else{
        // // 2. Check sides
        this.compareSides(usable_container, dimension_arr);
      }

      // // 3. Pack into container
      console.log("REMAINING CONTAINER: " + JSON.stringify(usable_container));
      // let num_topack = usable_container.

      let totalVol:number =  pdt_volume * element.orderedQuantity;
      
      // Push Record.  
      record.orderId = orderRequest.id;
      record.totalVolume.unit = "cubic " + unit;
    
    });



    //console.log(`USABLE CONTAINERS: ${JSON.stringify(usable_container)}`);

    //console.log(JSON.stringify(record));
    return record;

  }
}
