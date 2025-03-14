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
  Button,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFilePdf,
  faFileExcel,
  faFileImage,
  faDownload,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

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

const rowsPerPage = 100;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function App() {
  const [data, setData] = useState<EquipmentInventory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra khi người dùng cuộn xuống dưới và hiển thị nút scroll lên
  useEffect(() => {
    const handleScroll = () => {
      setIsScrollTopVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Hàm gọi API chung
  const fetchEquipmentInventories = async (page: number) => {
    if (!apiUrl) {
      console.error("API URL is not defined in .env.local");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get<APIResponse>(
        `${apiUrl}/api/equipment-inventories`,
        {
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
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm gọi API khi page thay đổi
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchEquipmentInventories(page);
      if (response) {
        setData(response.data);
        setTotalPages(response.meta.pagination.pageCount);
      }
    };

    fetchData();
  }, [page]);

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
        0
      ).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} year${years !== 1 ? "s" : ""} ${months} month${months !== 1 ? "s" : ""} ${days} day${days !== 1 ? "s" : ""}`;
  };

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
        return faFile;
    }
  };

  const exportToExcel = async () => {
    const allPagesData: EquipmentInventory[] = [];

    // Duyệt qua tất cả các trang
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const response = await fetchEquipmentInventories(currentPage);
      if (response) {
        allPagesData.push(...response.data);
      }
    }

    const wsData = allPagesData.map((item) => ({
      Code: item.code,
      "Employee Name": item.employee?.name,
      "Office Name": item.employee?.office.name,
      "Device Type": item.device_type?.name,
      "Device Model": item.device_model?.name,
      "Purchase Date": item.purchase_date,
      "Year Used": calculateYearUsed(item.purchase_date),
      "Device Status": item.device_status,
      "Warranty Duration": convertWarrantyToNumber(item.warranty_duration),
      Comment: item.comment
        .map((comment) => comment.children[0].text)
        .join(", "),
      Files: item.files
        ? item.files
            .map((file) => `=HYPERLINK("${apiUrl}${file.url}"; "${file.name}")`)
            .join(", ")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ITAM");

    XLSX.writeFile(wb, "ITAM.xlsx");
  };

  const convertWarrantyToNumber = (warranty: string): string => {
    const warrantyMap: { [key: string]: number } = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
    };

    const [numberWord] = warranty.toLowerCase().split(" ");

    const number = warrantyMap[numberWord] || 0; // Chuyển đổi từ chữ thành số
    return `${number} year${number > 1 ? "s" : ""}`; // Ghép số và 'year(s)'
  };

  return (
    <div>
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
        classNames={{ wrapper: "min-h-[222px]" }}
        topContent={
          <div className="flex w-full justify-end">
            <Button
              className="p-4 rounded-full text-white"
              color="success"
              onPress={exportToExcel}
            >
              <FontAwesomeIcon icon={faDownload} />
              .xlsx
            </Button>
          </div>
        }
      >
        <TableHeader>
          <TableColumn key="code" style={{ width: "8rem" }}>Code</TableColumn>
          <TableColumn key="employee_name" style={{ width: "13rem" }}>
            Employee
          </TableColumn>
          <TableColumn key="employee_office_name" style={{ width: "14rem" }}>Office</TableColumn>
          <TableColumn key="device_type">Device Type</TableColumn>
          <TableColumn key="device_model">Device Model</TableColumn>
          <TableColumn key="purchase_date">Purchase Date</TableColumn>
          <TableColumn key="year_used">Year Used</TableColumn>
          <TableColumn key="device_status">Device Status</TableColumn>
          <TableColumn key="warranty_duration">Warranty Duration</TableColumn>
          <TableColumn key="comment" style={{ width: "15rem" }}>Comment</TableColumn>
          <TableColumn key="file">File</TableColumn>
        </TableHeader>
        <TableBody items={data}>
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
              <TableCell>
                {convertWarrantyToNumber(item.warranty_duration)}
              </TableCell>
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
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FontAwesomeIcon
                            icon={getFileIcon(file.name)}
                            size="lg"
                          />
                        </a>
                      </div>
                    ))
                  : ""}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Nút Scroll to Top */}
      {isScrollTopVisible && (
        <button
          className="fixed bottom-10 right-10 p-4 bg-green-500 text-white rounded-full shadow-lg"
          onClick={scrollToTop}
        >
          <FontAwesomeIcon className="w-6" icon={faArrowUp} />
        </button>
      )}
    </div>
  );
}
