import { Dimensions } from "./interfaces";

export interface ContainerNewInfo{
    containerType: string; 
    dimensions: {
        length: number; 
        height: number; 
        width: number;
        containerVol: number, 
        arr: number[]
    }
}

export interface Product{
    id: string;
    name: string;
    orderedQuantity: number;
    unitPrice: number;
    dimensions: {
      unit: string;
      length: number;
      width: number;
      height: number;
    }
}

export interface ContainerUsed{
    containerType: string, 
    totalNum: number, 
    maxPerContainer: number, 
    containerVol: number
}


export interface TotalVolume{
    unit: string;
    value: number;
}

export interface Container{
    containerType: string;
    containingProducts: Array<ContainingProduct>;
}


export interface ContainingProduct{
    id: string;
    quantity: number;
}

export interface ProductDimensions{
    arr: number[];
    length: number;
    height: number;
    width: number;
    unit: string;
    
}