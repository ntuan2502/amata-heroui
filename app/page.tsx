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
  Tabs,
  Tab,
  Card,
  CardBody,
  Input,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFilePdf,
  faFileExcel,
  faFileImage,
  faDownload,
  faArrowUp,
  faSearch,
  faCircle,
  faCircleXmark,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

// Định nghĩa kiểu cho dữ liệu trả về từ API

interface Office {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  office: Office;
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
      total: number;
    };
  };
}

const rowsPerPage = 100;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function App() {
  const [data, setData] = useState<EquipmentInventory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [tabSelected, setTabSelected] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Kiểm tra khi người dùng cuộn xuống dưới và hiển thị nút scroll lên
  useEffect(() => {
    const handleScroll = () => {
      setIsScrollTopVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const fetchEquipmentInventories = async (
    page: number,
    officeName?: string
  ) => {
    if (!apiUrl) {
      console.error("API URL is not defined in .env.local");
      return;
    }
    setIsLoading(true);
    try {
      const params: any = {
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
      };

      // Nếu có officeName, thêm filter vào params
      if (officeName) {
        params["filters[employee][office][name][$eq]"] = officeName;
      }

      const response = await axios.get<APIResponse>(
        `${apiUrl}/api/equipment-inventories`,
        { params }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!tabSelected) return;
      const officeName = offices.find(
        (o) => o.id.toString() === tabSelected
      )?.name;
      const response = await fetchEquipmentInventories(page, officeName);
      if (response) {
        setData(response.data);
        setTotalPages(response.meta.pagination.pageCount);
        setTotalCount(response.meta.pagination.total);
      }
    };

    fetchData();
  }, [page, tabSelected, offices]);

  const calculateYearUsed = (purchaseDate: string) => {
    const currentDate = new Date();
    const purchaseDateObj = new Date(purchaseDate);

    let years = currentDate.getFullYear() - purchaseDateObj.getFullYear();
    let months = currentDate.getMonth() - purchaseDateObj.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} year${years !== 1 ? "s" : ""} ${months} month${months !== 1 ? "s" : ""}`;
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

    // Lấy officeName từ tab đang chọn
    const officeName = offices.find(
      (o) => o.id.toString() === tabSelected
    )?.name;

    // Lấy dữ liệu theo tab hiện tại
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const response = await fetchEquipmentInventories(currentPage, officeName);
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

    XLSX.writeFile(wb, `ITAM_${officeName}.xlsx`);
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

  // Gọi API lấy danh sách office
  useEffect(() => {
    const fetchOffices = async () => {
      const params: any = {
        sort: "name:asc",
      };

      try {
        const response = await axios.get<{ data: Office[] }>(
          `${apiUrl}/api/offices`,
          { params }
        );
        setOffices(response.data.data);
        if (response.data.data.length > 0) {
          setTabSelected(response.data.data[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching offices:", error);
      }
    };

    fetchOffices();
  }, []);

  const filteredData = data.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employee?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.device_type?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.device_model?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.device_status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Tabs
        aria-label="Office Tabs"
        selectedKey={tabSelected}
        onSelectionChange={(key) => setTabSelected(String(key))}
        className="flex flex-wrap"
      >
        {offices.map((office) => (
          <Tab key={office.id.toString()} title={office.name}>
            <Card>
              <CardBody>
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
                  classNames={
                    {
                      // wrapper: "max-h-screen overflow-y-auto",
                      // table: "border-collapse",
                      // thead: "sticky top-0 bg-white z-10",
                    }
                  }
                  topContent={
                    <div className="flex-row sm:flex w-full justify-between items-center">
                      <Input
                        label="Search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-96 mb-4 sm:mb-0"
                        startContent={<FontAwesomeIcon icon={faSearch} />}
                        endContent={
                          <FontAwesomeIcon
                            icon={faCircleXmark}
                            className="hover:cursor-pointer"
                            onClick={() => setSearchQuery("")}
                          />
                        }
                        autoFocus
                      />
                      <p>{totalCount} entries found</p>
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
                    <TableColumn key="code" style={{ width: "8rem" }}>
                      Code
                    </TableColumn>
                    <TableColumn key="employee_name" style={{ width: "13rem" }}>
                      Employee
                    </TableColumn>
                    <TableColumn
                      key="employee_office_name"
                      style={{ width: "14rem" }}
                    >
                      Office
                    </TableColumn>
                    <TableColumn key="device_type">Device Type</TableColumn>
                    <TableColumn key="device_model" style={{ width: "10rem" }}>
                      Device Model
                    </TableColumn>
                    <TableColumn key="purchase_date">Purchase Date</TableColumn>
                    <TableColumn key="year_used" style={{ width: "10rem" }}>
                      Year Used
                    </TableColumn>
                    <TableColumn key="device_status">Device Status</TableColumn>
                    <TableColumn key="warranty_duration">
                      Warranty Duration
                    </TableColumn>
                    <TableColumn key="comment">Comment</TableColumn>
                    <TableColumn key="file">File</TableColumn>
                  </TableHeader>
                  <TableBody items={filteredData}>
                    {(item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.employee?.name}</TableCell>
                        <TableCell>{item.employee?.office.name}</TableCell>
                        <TableCell>{item.device_type?.name}</TableCell>
                        <TableCell>{item.device_model?.name}</TableCell>
                        <TableCell>{item.purchase_date}</TableCell>
                        <TableCell>
                          {calculateYearUsed(item.purchase_date)}
                        </TableCell>
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
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>

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
