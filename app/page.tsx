"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFilePdf,
  faFileExcel,
  faFileImage,
} from "@fortawesome/free-solid-svg-icons";

// Định nghĩa kiểu cho dữ liệu trả về từ API
interface Employee {
  id: number;
  name: string;
  email: string;
  office: {
    id: number;
    name: string;
  };
}

interface DeviceType {
  id: number;
  name: string;
}

interface DeviceModel {
  id: number;
  name: string;
}

interface File {
  id: number;
  name: string;
  url: string;
}

interface Comment {
  type: string;
  children: {
    text: string;
    type: string;
  }[];
}

interface EquipmentInventory {
  id: number;
  code: string;
  serial_number: string;
  device_status: string;
  purchase_date: string;
  warranty_duration: string;
  employee: Employee;
  device_type: DeviceType;
  device_model: DeviceModel;
  files: File[] | null;
  comment: Comment[];
}

interface APIResponse {
  data: EquipmentInventory[];
  meta: {
    pagination: {
      pageCount: number;
    };
  };
}

export default function App() {
  const [data, setData] = useState<EquipmentInventory[]>([]); // Khai báo kiểu dữ liệu cho state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 100;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!apiUrl) {
      console.error("API URL is not defined in .env.local");

      return;
    }

    axios
      .get<APIResponse>(`${apiUrl}/api/equipment-inventories`, {
        params: {
          "pagination[page]": page,
          "pagination[pageSize]": rowsPerPage,
          sort: "code:asc",
          populate: [
            "employee",
            "employee.office",
            "device_type",
            "device_model",
            "supplier",
            "files",
          ],
        },
      })
      .then((response) => {
        setData(response.data.data);
        setTotalPages(response.data.meta.pagination.pageCount);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [page, apiUrl]);

  const items = React.useMemo(() => {
    return data;
  }, [data]);

  // Hàm để tính sự khác biệt ngày giữa ngày hiện tại và purchase_date
  const calculateYearUsed = (purchaseDate: string) => {
    const currentDate = new Date();
    const purchaseDateObj = new Date(purchaseDate);

    let years = currentDate.getFullYear() - purchaseDateObj.getFullYear();
    let months = currentDate.getMonth() - purchaseDateObj.getMonth();
    let days = currentDate.getDate() - purchaseDateObj.getDate();

    if (days < 0) {
      months--;
      days += new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0,
      ).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} year${years !== 1 ? "s" : ""} ${months} month${months !== 1 ? "s" : ""} ${days} day${days !== 1 ? "s" : ""}`;
  };

  // Hàm để xác định biểu tượng file dựa trên extension
  const getFileIcon = (fileName: string) => {
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    switch (fileExtension) {
      case "pdf":
        return faFilePdf;
      case "xlsx":
      case "xls":
        return faFileExcel;
      case "jpg":
      case "jpeg":
      case "png":
        return faFileImage;
      default:
        return faFile; // Dùng icon mặc định cho các file khác
    }
  };

  return (
    <Table
      aria-label="Example table with client side pagination"
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="secondary"
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
      }
      classNames={{
        wrapper: "min-h-[222px]",
      }}
      topContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="secondary"
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn key="code">Code</TableColumn>
        <TableColumn key="employee_name">Employee</TableColumn>
        <TableColumn key="employee_office_name">Office</TableColumn>
        <TableColumn key="device_type">Device Type</TableColumn>
        <TableColumn key="device_model">Device Model</TableColumn>
        <TableColumn key="purchase_date">Purchase Date</TableColumn>
        <TableColumn key="year_used">Year Used</TableColumn>
        <TableColumn key="device_status">Device Status</TableColumn>
        <TableColumn key="warranty_duration">Warranty Duration</TableColumn>
        <TableColumn key="comment">Comment</TableColumn>
        <TableColumn key="file">File</TableColumn>
      </TableHeader>
      <TableBody items={items}>
        {(item) => (
          <TableRow key={item.id}>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.employee?.name}</TableCell>
            <TableCell>{item.employee?.office.name}</TableCell>
            <TableCell>{item.device_type?.name}</TableCell>
            <TableCell>{item.device_model?.name}</TableCell>
            <TableCell>{item.purchase_date}</TableCell>
            <TableCell>{calculateYearUsed(item.purchase_date)}</TableCell>
            <TableCell>{item.device_status}</TableCell>
            <TableCell>{item.warranty_duration}</TableCell>
            <TableCell>
              {item.comment.map((comment, index) => (
                <div key={index}>{comment.children[0].text}</div>
              ))}
            </TableCell>
            <TableCell>
              {item.files
                ? item.files.map((file) => (
                    <div key={file.id}>
                      <a
                        href={`${apiUrl}${file.url}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span className="ml-2">
                          <FontAwesomeIcon
                            icon={getFileIcon(file.name)} // Lấy icon dựa trên tên file
                            size="lg"
                          />
                        </span>
                      </a>
                    </div>
                  ))
                : ""}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
