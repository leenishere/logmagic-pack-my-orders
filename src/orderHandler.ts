import { throws } from "assert";
import { timeStamp } from "console";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { exit } from "process";
import { stringify } from "querystring";
import { ContainerSpec, Dimensions, OrderRequest, ShipmentRecord } from "./interfaces";
import { ContainerNewInfo, ContainerUsed, Product, TotalVolume, Container , ContainingProduct, ProductDimensions} from "./newInterfaces";

export class OrderHandler {
  constructor(private parameters: { containerSpecs: ContainerSpec[] }) {}

  getVolume(length:number, height:number, width:number): number {
    if(length < 0 || height < 0 || width < 0){
      throw new Error ("Dimensions should not be negative");
    } else if (!length || !height || !width){
      throw new Error ("Dimensions are empty");
    }
    return length*height*width;
  }

  getContainerInfo() : Array<ContainerNewInfo>{
    const container_info: Array<ContainerNewInfo> = [];
    this.parameters.containerSpecs.forEach(container_spec => {
      
      const container_length:number = container_spec.dimensions.length;
      const container_height:number = container_spec.dimensions.height;
      const container_width:number = container_spec.dimensions.width;

      const container_volume:number = this.getVolume(container_length, container_height, container_width)
      const container_type:string = container_spec.containerType;
      container_info.push({containerType: container_type, dimensions:{length: container_length, height: container_height, width: container_width, containerVol: container_volume, arr:[container_length, container_height, container_width]}});
    });
    return container_info;
  }

  checkAvailContainer(remaining_usable_container: Array<ContainerNewInfo>) : boolean{
    if (remaining_usable_container.length > 0){
      return true;
    } else{
      return false;
    }
  }

  getMax(arr: number[]) : number{
    const largest_num = Math.max(...arr);
    return largest_num;   
  }

  compareLarger(container_side:number, product_side:number) : boolean{
    if (product_side > container_side){
      return true;
    } else {
      return false;
    }
  } 

  compareSingleVolume(product_volume: number) : Array<ContainerNewInfo>{
    const usable_container = this.getContainerInfo();  
    for (let i:number = usable_container.length-1; i >= 0; i--){
      const container_volume = usable_container[i].dimensions.containerVol;
      if (product_volume > container_volume){
        usable_container.splice(i,1);  
      }
    }
    return usable_container;
  }


  compareSides(usable_containers:Array<ContainerNewInfo>, product_arr:{arr:number[], length:number, height:number, width:number}) : void{
    usable_containers.forEach(container => {
      let container_array = container.dimensions.arr;
      if (container_array.length > 0){
        const largest_side_product = this.getMax(product_arr.arr);
        const largest_side_container = this.getMax(container_array);
        if (this.compareLarger(largest_side_container, largest_side_product)){
          usable_containers.splice(usable_containers.indexOf(container),1);
        } else {
          product_arr.arr.splice(product_arr.arr.indexOf(largest_side_product),1);
          container_array = container_array.splice(container_array.indexOf(largest_side_container),1);
          this.compareSides(usable_containers, product_arr);
        }
      }  

      else{
        product_arr.arr.push(product_arr.height);
        product_arr.arr.push(product_arr.length);
        product_arr.arr.push(product_arr.width);
      }

    });
    
  }

  getChosenContainer(remaining_usable_container:Array<ContainerNewInfo>, product_quantity:number, product_vol:number) : ContainerUsed{
    const total_pdt_vol: number = product_vol * product_quantity;
    const container_vol = remaining_usable_container[0].dimensions.containerVol;
    
    if (remaining_usable_container.length < 1){
      throw new Error("There is no container that can fit the product");
    } else{
      var num_containers:number = container_vol / total_pdt_vol;
      var max_fit_in_one:number = product_quantity;
      if (Math.abs(Math.floor(num_containers) - num_containers) > 0){
        max_fit_in_one = container_vol/product_vol;
        num_containers = Math.ceil(product_quantity/max_fit_in_one); 
      } 
    }
    return {containerType: remaining_usable_container[0].containerType, totalNum: num_containers, maxPerContainer: Math.floor(max_fit_in_one), containerVol: container_vol};    
  }


  getProductDimensions(orderProduct: Product): ProductDimensions{
    const product_length:number = orderProduct.dimensions.length;
    const product_height:number = orderProduct.dimensions.height;
    const product_width:number = orderProduct.dimensions.width;
    const product_unit = orderProduct.dimensions.unit;
    return {arr:[product_length, product_height, product_width], length: product_length, height: product_height, width: product_width, unit: product_unit}
  }

  getTotalVolume(orderProducts:Array<Product>) : TotalVolume{
    let remaining_usable_container: Array<ContainerNewInfo>;
    
    const totalVolume = {
      unit: "",
      value: 0
    }

    for (let i = 0; i < orderProducts.length; i++){
      const product_dimensions = this.getProductDimensions(orderProducts[i]);
      totalVolume.unit = "cubic " + product_dimensions.unit;

      // // 1. Check if volume of 1 product is bigger than container
      let product_volume:number = this.getVolume(product_dimensions.height, product_dimensions.length, product_dimensions.width);  
      remaining_usable_container = this.compareSingleVolume(product_volume);
      
      if (!this.checkAvailContainer(remaining_usable_container)){
        throw new Error("There is no container that can fit the product");
      } else{
        // // 2. Check sides
        this.compareSides(remaining_usable_container, product_dimensions);
         
        // // 3. Pack into container
        const product_quantity: number = orderProducts[i].orderedQuantity;
        const chosen_container = this.getChosenContainer(remaining_usable_container, product_quantity, product_volume)
        totalVolume.value = chosen_container.totalNum * chosen_container.containerVol;

      }

    };  

    return totalVolume;
  }
 
  getContainers(orderProducts:Array<Product>) : Array<Container>{
    let containing_products: Array<ContainingProduct> = [];
    let containers: Array<Container> = []; 
    let chosen_container: ContainerUsed;
    let remaining_usable_container: Array<ContainerNewInfo>;

    for (let i = 0; i < orderProducts.length; i++){
      const product_quantity = orderProducts[i].orderedQuantity;
      const product_dimensions = this.getProductDimensions(orderProducts[i]);
      let product_volume:number = this.getVolume(product_dimensions.height, product_dimensions.length, product_dimensions.width);  

      remaining_usable_container = this.compareSingleVolume(product_volume);
      
      if (!this.checkAvailContainer(remaining_usable_container)){
        throw new Error("There is no container that can fit the product");
      } else{
        this.compareSides(remaining_usable_container, product_dimensions);
        const product_quantity: number = orderProducts[i].orderedQuantity;
        chosen_container = this.getChosenContainer(remaining_usable_container, product_quantity, product_volume)
      }

      const remainder: number = product_quantity % chosen_container.maxPerContainer;
      if(remainder != 0){
        // IF THERE IS REMAINDER
        for (let k=0; k < chosen_container.totalNum-1; k++){
          // PUSH MAX BOXES
          containing_products = [];
          containing_products.push({id:orderProducts[i].id, quantity: chosen_container.maxPerContainer});   
          containers.push({containerType: chosen_container.containerType, containingProducts: containing_products}); 
        }
        
        // PUSH LAST BOX
        containing_products = [];
        containing_products.push({id:orderProducts[orderProducts.length-1].id, quantity: remainder});
        containers.push({containerType: chosen_container.containerType, containingProducts: containing_products}); 
  
      } else{
        for (let j=0; j < chosen_container.totalNum; j++){
          containing_products = [];
          containing_products.push({id:orderProducts[i].id, quantity: chosen_container.maxPerContainer});
          containers.push({containerType: chosen_container.containerType, containingProducts: containing_products}); 
        } 
  
      }
    }

    return containers;
  }


  packOrder(orderRequest: OrderRequest): ShipmentRecord {
    /* TODO: replace with actual implementation */

    console.log("ORDER REQUEST: " + orderRequest.id);
    const shipmentRecord: ShipmentRecord = {
      orderId: orderRequest.id,
      totalVolume: this.getTotalVolume(orderRequest.products),
      containers: this.getContainers(orderRequest.products)
    }

    console.log(JSON.stringify(shipmentRecord));
    return shipmentRecord;

  }
}
