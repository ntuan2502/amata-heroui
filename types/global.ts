import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Office {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  office: Office;
}

export interface DeviceType {
  id: number;
  name: string;
}

export interface DeviceModel {
  id: number;
  name: string;
}

export interface File {
  id: number;
  name: string;
  url: string;
}

export interface Comment {
  type: string;
  children: {
    text: string;
    type: string;
  }[];
}

export interface EquipmentInventory {
  id: number;
  code: string;
  serial_number: string;
  device_status: string;
  purchase_date: string;
  warranty_duration: string;
  os_type: string;
  employee: Employee;
  device_type: DeviceType;
  device_model: DeviceModel;
  files: File[] | null;
  comment: Comment[];
}

export interface APIResponse {
  data: EquipmentInventory[];
  meta: {
    pagination: {
      pageCount: number;
      total: number;
    };
  };
}
