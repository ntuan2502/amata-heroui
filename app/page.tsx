"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
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
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

// Types
import {
  Office,
  EquipmentInventory,
  APIResponse,
  File as FileType,
} from "../types/index";

// Constants
const ROWS_PER_PAGE = 100;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Utility functions
const convertWarrantyToNumber = (warranty: string): string => {
  const warrantyMap: { [key: string]: number } = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };

  const [numberWord] = warranty.toLowerCase().split(" ");
  const number = warrantyMap[numberWord] || 0;
  return `${number} year${number > 1 ? "s" : ""}`;
};

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

// Component for the data table
interface DataTableProps {
  data: EquipmentInventory[];
  page: number;
  totalPages: number;
  totalCount: number;
  searchQuery: string;
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  exportToExcel: () => void;
  apiUrl: string | undefined;
  handleSearchSubmit: () => void; // Add this new prop
}

function DataTable({
  data,
  page,
  totalPages,
  totalCount,
  searchQuery,
  setPage,
  setSearchQuery,
  exportToExcel,
  apiUrl,
  handleSearchSubmit, // Add this parameter
}: DataTableProps) {
  return (
    <Table
      aria-label="Equipment inventory table"
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="secondary"
            page={page}
            total={totalPages}
            onChange={setPage}
          />
        </div>
      }
      topContent={
        <div className="flex-row sm:flex w-full justify-between items-center">
          <div className="flex justify-center items-center">
            <Input
              label="Search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96 mb-4 sm:mb-0"
              startContent={<FontAwesomeIcon icon={faSearch} />}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              autoFocus
            />
            <Button
              color="primary"
              className="mx-3"
              onPress={handleSearchSubmit}
            >
              Submit
            </Button>
          </div>
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
        <TableColumn key="employee_office_name" style={{ width: "14rem" }}>
          Office
        </TableColumn>
        <TableColumn key="device_type">Device Type</TableColumn>
        <TableColumn key="device_model" style={{ width: "10rem" }}>
          Device Model
        </TableColumn>
        <TableColumn key="os_type" style={{ width: "7rem" }}>
          OS Type
        </TableColumn>
        <TableColumn key="purchase_date">Purchase Date</TableColumn>
        <TableColumn key="year_used" style={{ width: "9rem" }}>
          Year Used
        </TableColumn>
        <TableColumn key="device_status">Device Status</TableColumn>
        <TableColumn key="warranty_duration">Warranty Duration</TableColumn>
        <TableColumn key="comment">Comment</TableColumn>
        <TableColumn key="file">File</TableColumn>
      </TableHeader>
      <TableBody items={data}>
        {(item) => (
          <TableRow
            key={item.id}
            style={{
              backgroundColor: (() => {
                const purchaseDateObj = new Date(item.purchase_date);
                const currentDate = new Date();
                const yearsUsed =
                  currentDate.getFullYear() - purchaseDateObj.getFullYear();
                return yearsUsed >= 6 ? "red" : "transparent";
              })(),
            }}
          >
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.employee?.name}</TableCell>
            <TableCell>{item.employee?.office.name}</TableCell>
            <TableCell>{item.device_type?.name}</TableCell>
            <TableCell>{item.device_model?.name}</TableCell>
            <TableCell>{item.os_type}</TableCell>
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
  );
}

export default function App() {
  const router = useRouter();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Data states
  const [data, setData] = useState<EquipmentInventory[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  // UI control states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tabSelected, setTabSelected] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState("");

  // Authentication check
  useEffect(() => {
    const token = Cookies.get("token");
    const user = Cookies.get("user");

    if (!token || !user) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsScrollTopVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch offices data
  useEffect(() => {
    const fetchOffices = async () => {
      if (!API_URL) return;

      try {
        const response = await axios.get<{ data: Office[] }>(
          `${API_URL}/api/offices`,
          { params: { sort: "name:asc" } }
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

  // API call function
  const fetchEquipmentInventories = useCallback(
    async (page: number, officeName?: string, searchQuery?: string) => {
      if (!API_URL) {
        console.error("API URL is not defined in .env.local");
        return null;
      }

      setIsLoading(true);
      try {
        const params: any = {
          "pagination[page]": page,
          "pagination[pageSize]": ROWS_PER_PAGE,
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

        if (officeName) {
          params["filters[employee][office][name][$eq]"] = officeName;
        }

        if (searchQuery) {
          params["filters[$or][0][code][$containsi]"] = searchQuery;
          params["filters[$or][1][employee][name][$containsi]"] = searchQuery;
          params["filters[$or][2][device_model][name][$containsi]"] = searchQuery;
          params["filters[$or][3][os_type][$containsi]"] = searchQuery;
          params["filters[$or][4][device_status][$containsi]"] = searchQuery;
        }

        const response = await axios.get<APIResponse>(
          `${API_URL}/api/equipment-inventories`,
          { params }
        );

        return response.data;
      } catch (error) {
        console.error("Error fetching data:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!tabSelected) return;
      const officeName = offices.find(
        (o) => o.id.toString() === tabSelected
      )?.name;
      const response = await fetchEquipmentInventories(
        page,
        officeName,
        searchQuery
      );
      if (response) {
        setData(response.data);
        setTotalPages(response.meta.pagination.pageCount);
        setTotalCount(response.meta.pagination.total);
      }
    };

    fetchData();
  }, [page, tabSelected, refreshTrigger, fetchEquipmentInventories, offices]);

  // Add the handleSearchSubmit function
  const handleSearchSubmit = () => {
    setRefreshTrigger(searchQuery);
    setPage(1);
  };

  // Export to Excel functionality
  const exportToExcel = useCallback(async () => {
    const allPagesData: EquipmentInventory[] = [];

    const officeName = offices.find(
      (o) => o.id.toString() === tabSelected
    )?.name;

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const response = await fetchEquipmentInventories(
        currentPage,
        officeName,
        searchQuery
      );
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
      "OS Type": item.os_type,
      "Purchase Date": item.purchase_date,
      "Year Used": calculateYearUsed(item.purchase_date),
      "Device Status": item.device_status,
      "Warranty Duration": convertWarrantyToNumber(item.warranty_duration),
      Comment: item.comment
        .map((comment) => comment.children[0].text)
        .join(", "),
      Files: item.files
        ? item.files
            .map(
              (file) => `=HYPERLINK("${API_URL}${file.url}"; "${file.name}")`
            )
            .join(", ")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ITAM");

    XLSX.writeFile(wb, `ITAM_${officeName}.xlsx`);
  }, [fetchEquipmentInventories, offices, tabSelected, totalPages]);

  // Helper function for scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return <div className="text-center mt-10">Check authentication...</div>;
  }

  // Render component
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
                <DataTable
                  data={data}
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  searchQuery={searchQuery}
                  setPage={setPage}
                  setSearchQuery={setSearchQuery}
                  exportToExcel={exportToExcel}
                  apiUrl={API_URL}
                  handleSearchSubmit={handleSearchSubmit} // Pass the new function
                />
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>

      {/* Scroll to Top Button */}
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
