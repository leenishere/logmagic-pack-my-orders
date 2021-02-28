import { throws } from "assert";
import { timeStamp } from "console";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { exit } from "process";
import { stringify } from "querystring";
import { ContainerSpec, OrderRequest, ShipmentRecord } from "./interfaces";
import { ContainerNewInfo, ContainerUsed, Product } from "./newInterfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {}

   /**
   *  @desc calculate volume
   *  @param height:number, breadth:number, width:number
   *  @returns volume: number
  **/
  getVolume(height:number, breadth:number, width:number): number {
    if(height < 0 || breadth < 0 || width < 0){
      throw new Error ("Dimensions should not be negative");
    } else if (height == null || breadth == null || width == null){
      throw new Error ("Dimensions are empty");
    }
    return height*breadth*width;
  }

  /**
   *  @desc calc specifications with volume of container
   *  @param height:number, breadth:number, width:number
   *  @returns container_info: Array<>
  **/
  getContainerInfo() : Array<ContainerNewInfo>{
    let container_info: Array<ContainerNewInfo> = [];
    this.parameters.containerSpecs.forEach(element => {
      
      const x:number = element.dimensions.length;
      const y:number = element.dimensions.height;
      const z:number = element.dimensions.width;

      const volume:number = this.getVolume(x,y,z)
      const container:string = element.containerType;
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
  compareSingleVolume(pdt_volume: number) : Array<ContainerNewInfo>{
    const container_info = this.getContainerInfo();  
    
    for (let i:number = container_info.length-1; i >= 0; i--){
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
  checkAvailContainer(usable_container: Array<ContainerNewInfo>){
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
    // CLconsole.log("container: " + container_side + " product: " +product_side);
    if (product_side > container_side){
      return true;
    } else {
      return false;
    }
  } 

  compareSides(usable_container:Array<ContainerNewInfo>, pdt_arr:{arr:number[], length:number, height:number, width:number}) : void{
    usable_container.forEach(element => {
      let container_array = element.dimensions.arr;
      if (container_array.length > 0){
        const largest_side_product = this.getMax(pdt_arr.arr);
        const largest_side_container = this.getMax(container_array);
        if (this.compareLarger(largest_side_container, largest_side_product)){
          usable_container.splice(usable_container.indexOf(element),1);
        } else {
          pdt_arr.arr.splice(pdt_arr.arr.indexOf(largest_side_product),1);
          container_array = container_array.splice(container_array.indexOf(largest_side_container),1);
          this.compareSides(usable_container, pdt_arr);
        }
      }  

      else{
        pdt_arr.arr.push(pdt_arr.height);
        pdt_arr.arr.push(pdt_arr.length);
        pdt_arr.arr.push(pdt_arr.width);
      }

    });
    
  }

  getNumberOfContainer(usable_container:Array<ContainerNewInfo>, pdt_quantity:number, pdt_vol:number) : ContainerUsed{
    const total_pdt_vol: number = pdt_vol * pdt_quantity;
    const container_vol = usable_container[0].dimensions.containerVol;
    
    if (usable_container.length < 1){
      throw new Error("There is no container that can fit the product");
    } else{
      var num_containers:number = container_vol / total_pdt_vol;
      var max_fit_in_one:number = pdt_quantity;
      if (Math.abs(Math.floor(num_containers) - num_containers) > 0){
        max_fit_in_one = container_vol/pdt_vol;
        num_containers = Math.ceil(pdt_quantity/max_fit_in_one); 
      } 
    }
    return {containerType: usable_container[0].containerType, totalNum: num_containers, maxPerContainer: Math.floor(max_fit_in_one), containerVol: container_vol};    
  }

  getRecord(pdt_quantity: number, container_used: ContainerUsed, orderProducts:Array<Product>, orderId:string, unit:string) : ShipmentRecord{
    let record: ShipmentRecord = {
      orderId: "",
      totalVolume: { // volume of ALL containers
        unit: "",
        value: 0,
      },
      containers: [] // record of each container used. quantity - number of product packed inside.
    };

    let container_pdts: Array<{id:string, quantity:number}> = []; ////// CONTAINING PDTS
    let containers: Array<{containerType:string, containingProducts:Array<{id:string, quantity:number}>}> = []; //// CONTAINER
    
    const lastbox:number = pdt_quantity % container_used.maxPerContainer;
 
    if(lastbox != 0){
      // IF REMAINDER
      for (let i=0; i < container_used.totalNum-1; i++){
        // PUSH MAX BOXES
        container_pdts = [];
        container_pdts.push({id:orderProducts[0].id, quantity: container_used.maxPerContainer});   
        containers.push({containerType: container_used.containerType, containingProducts: container_pdts}); 
      }
      
      // PUSH LAST BOX
      container_pdts = [];
      container_pdts.push({id:orderProducts[orderProducts.length-1].id, quantity: lastbox});
      containers.push({containerType: container_used.containerType, containingProducts: container_pdts}); 

    } else{
      for (let j=0; j < container_used.totalNum; j++){
        container_pdts = [];
        container_pdts.push({id:orderProducts[0].id, quantity: container_used.maxPerContainer});
        containers.push({containerType: container_used.containerType, containingProducts: container_pdts}); 
       
      } 
    }

    // Push Record.  
    record.orderId = orderId;
    record.totalVolume.unit = "cubic " + unit;
    record.totalVolume.value = container_used.totalNum*container_used.containerVol;
    record.containers = containers;
    return record;
  }

  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */
    
    const orderProducts = orderRequest.products;
    console.log("ORDER REQUEST: " + orderRequest.id);
   
    let usable_container: Array<ContainerNewInfo>;
    let record: ShipmentRecord;
    
    
    for (let i = 0; i < orderProducts.length; i++){
      const pdt_x:number = orderProducts[i].dimensions.length;
      const pdt_y:number = orderProducts[i].dimensions.height;
      const pdt_z:number = orderProducts[i].dimensions.width;
      const unit:string = orderProducts[i].dimensions.unit;
      const pdt_vals = {arr:[pdt_x, pdt_y, pdt_z], length: pdt_x, height: pdt_y, width: pdt_z};
    
      // // 1. Check if volume of 1 product is bigger than container
      let pdt_volume:number = this.getVolume(pdt_x,pdt_y,pdt_z);  
      usable_container = this.compareSingleVolume(pdt_volume);
      
      if (!this.checkAvailContainer(usable_container)){
        throw new Error("There is no container that can fit the product");
      } else{
        // // 2. Check sides
        this.compareSides(usable_container, pdt_vals);
         
        // // 3. Pack into container
        const pdt_quantity: number = orderProducts[i].orderedQuantity;
        const container_used = this.getNumberOfContainer(usable_container, pdt_quantity, pdt_volume);

        record = this.getRecord(pdt_quantity, container_used, orderProducts, orderRequest.id, unit);  
      }

    };  
    
    console.log(JSON.stringify(record));
    return record;

  }
}
